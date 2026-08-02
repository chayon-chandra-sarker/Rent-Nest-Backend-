import Stripe from "stripe";
import config from "../../config";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";

const stripe = new Stripe(config.strip_secret_key as string);

/* =========================================================
   CREATE CHECKOUT SESSION
========================================================= */

const createCheckoutSession = async (userId: string) => {
  const rentalRequest = await prisma.rentalRequest.findFirstOrThrow({
    where: {
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

  /* =========================================
     CHECK PAYMENT ALREADY COMPLETED
  ========================================= */

  if (rentalRequest.payment?.status === "COMPLETED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Payment already completed",
    );
  }

  /* =========================================
     STRIPE CUSTOMER
  ========================================= */

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

  /* =========================================
     CREATE PENDING PAYMENT
  ========================================= */

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

  /* =========================================
     STRIPE CHECKOUT
  ========================================= */

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

    success_url: `${config.app_url}/payment?success=true`,

    cancel_url: `${config.app_url}/payment?canceled=true`,

    metadata: {
      rentalRequestId: rentalRequest.id,
    },
  });

  console.log("Stripe Checkout Session:", session.id);

  console.log(
    "Rental Request ID:",
    rentalRequest.id,
  );

  return {
    paymentUrl: session.url,
  };
};

/* =========================================================
   STRIPE WEBHOOK
========================================================= */

const handleWebhook = async (
  payload: Buffer,
  signature: string,
) => {
  console.log("=================================");
  console.log("WEBHOOK START");
  console.log("=================================");

  console.log("Payload is Buffer:", Buffer.isBuffer(payload));

  console.log("Signature exists:", !!signature);

  console.log(
    "Webhook secret exists:",
    !!config.strip_webhook_secret,
  );

  try {
    /* =========================================
       VERIFY STRIPE EVENT
    ========================================= */

    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.strip_webhook_secret as string,
    );

    console.log("Stripe Event:", event.type);

    /* =========================================
       CHECKOUT COMPLETED
    ========================================= */

    if (event.type === "checkout.session.completed") {
      console.log("Checkout session completed!");

      const session =
        event.data.object as Stripe.Checkout.Session;

      console.log("Session ID:", session.id);

      /* =========================================
         GET METADATA
      ========================================= */

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

      /* =========================================
         VALIDATION
      ========================================= */

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

      /* =========================================
         FIND PAYMENT
      ========================================= */

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

      /* =========================================
         CHECK IF ALREADY COMPLETED
      ========================================= */

      if (payment.status === "COMPLETED") {
        console.log(
          "Payment already completed. Skipping update.",
        );

        return;
      }

      /* =========================================
         UPDATE PAYMENT
      ========================================= */

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

      /* =========================================
         UPDATE RENTAL REQUEST
      ========================================= */

      const updatedRentalRequest =
        await prisma.rentalRequest.update({
          where: {
            id: rentalRequestId,
          },

          data: {
            status: "ACTIVE",
          },
        });

      console.log(
        "Rental request updated successfully:",
        {
          id: updatedRentalRequest.id,
          status: updatedRentalRequest.status,
        },
      );

      console.log(
        "=================================",
      );

      console.log(
        "PAYMENT COMPLETED SUCCESSFULLY",
      );

      console.log(
        "=================================",
      );
    } else {
      console.log(
        "Unhandled event type:",
        event.type,
      );
    }

    console.log("WEBHOOK SUCCESS");

    return;
  } catch (error) {
    console.error(
      "=================================",
    );

    console.error("WEBHOOK ERROR");

    console.error(error);

    console.error(
      "=================================",
    );

    throw error;
  }
};

/* =========================================================
   GET MY PAYMENTS
========================================================= */

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

/* =========================================================
   GET ALL PAYMENTS
========================================================= */

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

/* =========================================================
   GET LANDLORD PAYMENTS
========================================================= */

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

/* =========================================================
   EXPORT
========================================================= */

export const paymentService = {
  createCheckoutSession,
  handleWebhook,
  getMyPayments,
  getAllPaymentsFromDB,
  getLandlordPayments,
};