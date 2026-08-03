import Stripe from "stripe";
import config from "../../config";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";

const stripe = new Stripe(config.strip_secret_key as string);


const createCheckoutSession = async (
  userId: string,
  rentalRequestId: string,
) => {
  const rentalRequest =
    await prisma.rentalRequest.findFirstOrThrow({
      where: {
        id: rentalRequestId,
        tenantId: userId,
        status: "APPROVED",
      },
      include: {
        property: true,
        payment: true,
      },
    });

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId,
    },
  });

  if (rentalRequest.payment?.status === "COMPLETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment already completed",
    );
  }

  let stripeCustomerId = user.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user.id,
      },
    });

    stripeCustomerId = customer.id;

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        stripeCustomerId,
      },
    });
  }

  if (!rentalRequest.payment) {
    await prisma.payment.create({
      data: {
        rentalRequestId: rentalRequest.id,
        transactionId: crypto.randomUUID(),
        amount: rentalRequest.property.price,
        provider: "STRIPE",
        status: "PENDING",
      },
    });

    console.log(
      "Pending payment created for rental:",
      rentalRequest.id,
    );
  }

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: config.strip_product_price_id,
        quantity: 1,
      },
    ],

    mode: "payment",

    customer: stripeCustomerId,

    payment_method_types: ["card"],

    success_url: `${config.app_url}/payment?success=true&session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${config.app_url}/payment?canceled=true`,

    metadata: {
      rentalRequestId: rentalRequest.id,
    },
  });

  return {
    paymentUrl: session.url,
  };
};



const handleWebhook = async (
  payload: Buffer,
  signature: string,
) => {

  try {
 
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.strip_webhook_secret as string,
    );

    if (event.type === "checkout.session.completed") {
      console.log("Checkout session completed!");

      const session =
        event.data.object as Stripe.Checkout.Session;

      console.log("Session ID:", session.id);

      const rentalRequestId =
        session.metadata?.rentalRequestId;

      const paymentIntentId =
        session.payment_intent as string;

      const stripeCustomerId =
        session.customer as string;

      console.log(
        "Rental Request ID:",
        rentalRequestId,
      );

      console.log(
        "Payment Intent ID:",
        paymentIntentId,
      );

      console.log(
        "Stripe Customer ID:",
        stripeCustomerId,
      );

      if (!rentalRequestId) {
        throw new Error(
          "Rental request ID missing from Stripe metadata",
        );
      }

      if (!paymentIntentId) {
        throw new Error(
          "Payment intent ID missing",
        );
      }

      const payment = await prisma.payment.findUnique({
        where: {
          rentalRequestId,
        },
      });

      console.log("Payment found:", !!payment);

      if (!payment) {
        throw new Error(
          `Payment not found for rentalRequestId: ${rentalRequestId}`,
        );
      }

      if (payment.status === "COMPLETED") {
        console.log(
          "Payment already completed. Skipping update.",
        );

        return;
      }

      const updatedPayment =
        await prisma.payment.update({
          where: {
            rentalRequestId,
          },

          data: {
            status: "COMPLETED",

            transactionId:
              paymentIntentId,

            paidAt: new Date(),
          },
        });

      console.log(
        "Payment updated successfully:",
        {
          id: updatedPayment.id,
          status: updatedPayment.status,
          transactionId:
            updatedPayment.transactionId,
          paidAt: updatedPayment.paidAt,
        },
      );

      const updatedRentalRequest =
        await prisma.rentalRequest.update({
          where: {
            id: rentalRequestId,
          },

          data: {
            status: "ACTIVE",
          },
        });

    } else {
      console.log(
        "Unhandled event type:",
        event.type,
      );
    }

    return;
  } catch (error) {
    throw error;
  }
};

const verifyCheckoutSession = async (
  userId: string,
  sessionId: string,
) => {
  const session =
    await stripe.checkout.sessions.retrieve(
      sessionId,
    );

  if (session.payment_status !== "paid") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment has not been completed",
    );
  }

  const rentalRequestId =
    session.metadata?.rentalRequestId;

  if (!rentalRequestId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Rental request ID missing from Stripe session",
    );
  }

  const rentalRequest =
    await prisma.rentalRequest.findUnique({
      where: {
        id: rentalRequestId,
      },
      include: {
        payment: true,
      },
    });

  if (!rentalRequest) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Rental request not found",
    );
  }

  if (rentalRequest.tenantId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You don't have permission to verify this payment",
    );
  }

  const paymentIntentId =
    session.payment_intent as string;

  if (!paymentIntentId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment intent ID missing",
    );
  }

  await prisma.$transaction(async (tx) => {
    if (rentalRequest.payment) {
      await tx.payment.update({
        where: {
          id: rentalRequest.payment.id,
        },
        data: {
          status: "COMPLETED",
          transactionId: paymentIntentId,
          paidAt: new Date(),
        },
      });
    }

    await tx.rentalRequest.update({
      where: {
        id: rentalRequestId,
      },
      data: {
        status: "ACTIVE",
      },
    });
  });

  return {
    success: true,
    status: "COMPLETED",
    rentalStatus: "ACTIVE",
  };
};

const getMyPayments = async (userId: string) => {
  const payments = await prisma.payment.findMany({
    where: {
      rentalRequest: {
        tenantId: userId,
      },
    },

    include: {
      rentalRequest: {
        include: {
          property: {
            select: {
              title: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return payments.map((payment) => ({
    amount: payment.amount,

    currency: payment.currency,

    status: payment.status,

    paidAt: payment.paidAt,

    transactionId:
      payment.transactionId,

    propertyTitle:
      payment.rentalRequest.property.title,
  }));
};

const getAllPaymentsFromDB = async () => {
  const payments = await prisma.payment.findMany({
    include: {
      rentalRequest: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          property: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return payments.map((payment) => ({
    id: payment.id,

    transactionId:
      payment.transactionId,

    amount:
      payment.amount,

    currency:
      payment.currency,

    status:
      payment.status,

    paidAt:
      payment.paidAt,

    createdAt:
      payment.createdAt,

    tenant: {
      id:
        payment.rentalRequest.tenant.id,

      name:
        payment.rentalRequest.tenant.name,

      email:
        payment.rentalRequest.tenant.email,
    },

    property: {
      id:
        payment.rentalRequest.property.id,

      title:
        payment.rentalRequest.property.title,

      location:
        payment.rentalRequest.property.location,
    },
  }));
};

const getLandlordPayments = async (
  landlordId: string,
) => {
  const payments = await prisma.payment.findMany({
    where: {
      rentalRequest: {
        property: {
          landlordId,
        },
      },
    },

    include: {
      rentalRequest: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },

          property: {
            select: {
              id: true,
              title: true,
              location: true,
            },
          },
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return payments.map((payment) => ({
    id: payment.id,

    transactionId:
      payment.transactionId,

    amount:
      payment.amount,

    currency:
      payment.currency,

    status:
      payment.status,

    paidAt:
      payment.paidAt,

    createdAt:
      payment.createdAt,

    tenant: {
      id:
        payment.rentalRequest.tenant.id,

      name:
        payment.rentalRequest.tenant.name,

      email:
        payment.rentalRequest.tenant.email,
    },

    property: {
      id:
        payment.rentalRequest.property.id,

      title:
        payment.rentalRequest.property.title,

      location:
        payment.rentalRequest.property.location,
    },
  }));
};

export const paymentService = {
  createCheckoutSession,
  handleWebhook,
  getMyPayments,
  getAllPaymentsFromDB,
  getLandlordPayments,
  verifyCheckoutSession,
};