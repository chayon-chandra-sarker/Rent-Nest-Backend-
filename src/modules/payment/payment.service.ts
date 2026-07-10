import Stripe from "stripe";
import config from "../../config";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";

const stripe = new Stripe(config.strip_secret_key as string);

const createCheckoutSession = async (userId: string) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const rentalRequest = await tx.rentalRequest.findFirstOrThrow({
      where: {
        tenantId: userId,
        status: "APPROVED",
      },
      include: {
        property: true,
        payment: true,
      },
    });
    const user = await tx.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
    });

    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      });
      stripeCustomerId = customer.id;
      await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          stripeCustomerId,
        },
      });
    }

    if (rentalRequest.payment?.status === "COMPLETED") {
      throw new AppError(httpStatus.BAD_REQUEST, "Payment already completed");
    }

    if (!rentalRequest.payment) {
      await tx.payment.create({
        data: {
          rentalRequestId: rentalRequest.id,
          transactionId: crypto.randomUUID(),
          amount: rentalRequest.property.price,
          provider: "STRIPE",
          status: "PENDING",
        },
      });
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
      success_url: `${config.app_url}/payment?success=true`,
      cancel_url: `${config.app_url}/payment?success=false`, //ata akta font end route page hoba
      metadata: { rentalRequestId: rentalRequest.id },
    });
    return session.url;
  });
  return {
    paymentUrl: transactionResult,
  };
};

export const paymentService = {
  createCheckoutSession,
};
