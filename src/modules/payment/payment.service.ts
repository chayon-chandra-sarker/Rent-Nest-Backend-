import Stripe from "stripe";
import config from "../../config";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";

const stripe = new Stripe(config.strip_secret_key as string);

const createCheckoutSession = async (userId: string) => {
 
  // 1. Find approved rental request
  const rentalRequest =
    await prisma.rentalRequest.findFirst({
      where: {
        tenantId: userId,
        status: "APPROVED",
      },

      include: {
        property: true,
        payment: true,
      },

      orderBy: {
        approvedAt: "desc",
      },
    });

  if (!rentalRequest) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "No approved rental request found",
    );
  }

  // 2. Check if payment already completed
  if (rentalRequest.payment?.status === "COMPLETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment already completed",
    );
  }

  // 3. Get user
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not found",
    );
  }

  // 4. Get/Create Stripe customer
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

  // 5. Create pending payment if payment doesn't exist
  let payment = rentalRequest.payment;

  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        rentalRequestId: rentalRequest.id,
        transactionId: crypto.randomUUID(),
        amount: rentalRequest.property.price,
        provider: "STRIPE",
        status: "PENDING",
      },
    });
  }

  // 6. Create Stripe checkout session
  const session = await stripe.checkout.sessions.create({
    mode: "payment",

    customer: stripeCustomerId,

    payment_method_types: ["card"],

    line_items: [
      {
        price: config.strip_product_price_id,
        quantity: 1,
      },
    ],

    success_url:
      `${config.app_url}/payment?success=true`,

    cancel_url:
      `${config.app_url}/payment?canceled=true`,

    metadata: {
      rentalRequestId: rentalRequest.id,
      paymentId: payment.id,
      userId: user.id,
    },
  });

  if (!session.url) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to create Stripe checkout URL",
    );
  }

  return {
    paymentUrl: session.url,
  };
};

const handleWebhook = async (
  payload: Buffer,
  signature: string,
) => {

  try {
    if (!signature) {
      throw new Error(
        "Stripe signature is missing",
      );
    }

    if (!config.strip_webhook_secret) {
      throw new Error(
        "Stripe webhook secret is missing",
      );
    }

    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        "Webhook payload must be a Buffer",
      );
    }

    // Verify Stripe webhook
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.strip_webhook_secret,
    );

    if (
      event.type ===
      "checkout.session.completed"
    ) {
      console.log(
        "Checkout session completed",
      );

      const session =
        event.data.object as Stripe.Checkout.Session;

      console.log(
        "Session ID:",
        session.id,
      );

      const rentalRequestId =
        session.metadata?.rentalRequestId;

      const paymentId =
        session.metadata?.paymentId;

      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;

      console.log(
        "Rental Request ID:",
        rentalRequestId,
      );

      console.log(
        "Payment ID:",
        paymentId,
      );

      console.log(
        "Payment Intent ID:",
        paymentIntentId,
      );

      // Metadata validation
      if (!rentalRequestId) {
        throw new Error(
          "Rental request ID missing from Stripe metadata",
        );
      }

      if (!paymentId) {
        throw new Error(
          "Payment ID missing from Stripe metadata",
        );
      }

      if (!paymentIntentId) {
        throw new Error(
          "Payment Intent ID missing",
        );
      }

      const existingPayment =
        await prisma.payment.findUnique({
          where: {
            id: paymentId,
          },
        });

      if (!existingPayment) {
        throw new Error(
          "Payment record not found",
        );
      }

      if (
        existingPayment.status ===
        "COMPLETED"
      ) {
        console.log(
          "Payment already completed. Skipping.",
        );

        console.log(
          "========== WEBHOOK SUCCESS ==========",
        );

        return;
      }

      /* ===================================================
         UPDATE PAYMENT
      =================================================== */

      await prisma.payment.update({
        where: {
          id: paymentId,
        },

        data: {
          status: "COMPLETED",
          transactionId: paymentIntentId,
          paidAt: new Date(),
        },
      });

      console.log(
        "Payment updated successfully",
      );

      /* ===================================================
         UPDATE RENTAL REQUEST
      =================================================== */

      await prisma.rentalRequest.update({
        where: {
          id: rentalRequestId,
        },

        data: {
          status: "ACTIVE",
        },
      });

      console.log(
        "Rental request updated successfully",
      );

      console.log(
        "Payment completed successfully",
      );
    }

    else if (
      event.type ===
      "checkout.session.async_payment_failed"
    ) {
      console.log(
        "Checkout payment failed",
      );

      const session =
        event.data.object as Stripe.Checkout.Session;

      const paymentId =
        session.metadata?.paymentId;

      if (paymentId) {
        await prisma.payment.update({
          where: {
            id: paymentId,
          },

          data: {
            status: "FAILED",
          },
        });

        console.log(
          "Payment marked as FAILED",
        );
      }
    }

    else if (
      event.type ===
      "checkout.session.expired"
    ) {
      console.log(
        "Checkout session expired",
      );

      const session =
        event.data.object as Stripe.Checkout.Session;

      const paymentId =
        session.metadata?.paymentId;

      if (paymentId) {
        await prisma.payment.update({
          where: {
            id: paymentId,
          },

          data: {
            status: "FAILED",
          },
        });

        console.log(
          "Expired payment marked as FAILED",
        );
      }
    }

    else {
      console.log(
        "Unhandled event type:",
        event.type,
      );
    }

    console.log(
      "========== WEBHOOK SUCCESS ==========",
    );
  } catch (error) {
    console.error(
      "========== WEBHOOK ERROR ==========",
    );

    console.error(error);

    throw error;
  }
};

const getMyPayments = async (
  userId: string,
) => {
  const payments =
    await prisma.payment.findMany({
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
  const payments =
    await prisma.payment.findMany({
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

    amount: payment.amount,

    currency: payment.currency,

    status: payment.status,

    paidAt: payment.paidAt,

    createdAt: payment.createdAt,

    tenant: {
      id: payment.rentalRequest.tenant.id,

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
  const payments =
    await prisma.payment.findMany({
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

    amount: payment.amount,

    currency: payment.currency,

    status: payment.status,

    paidAt: payment.paidAt,

    createdAt: payment.createdAt,

    tenant: {
      id: payment.rentalRequest.tenant.id,

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
};