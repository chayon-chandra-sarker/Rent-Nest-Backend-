import type { Request, Response } from "express";
import httpStatus from "http-status";

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";
import AppError from "../../errors/AppError";

/* =========================================================
   CREATE CHECKOUT SESSION
========================================================= */

const createCheckoutSession = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const result =
      await paymentService.createCheckoutSession(userId);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Checkout session created successfully",
      data: result,
    });
  },
);

/* =========================================================
   STRIPE WEBHOOK
========================================================= */

const handleWebhook = catchAsync(
  async (req: Request, res: Response) => {
    const signature =
      req.headers["stripe-signature"];

    if (!signature) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Stripe signature is missing",
      );
    }

    const payload = req.body as Buffer;

    await paymentService.handleWebhook(
      payload,
      signature as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Webhook handled successfully",
      data: null,
    });
  },
);

/* =========================================================
   GET MY PAYMENTS
========================================================= */

const getMyPayments = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const result =
      await paymentService.getMyPayments(
        req.user.id,
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "My payments retrieved successfully",
      data: result,
    });
  },
);

/* =========================================================
   GET LANDLORD PAYMENTS
========================================================= */

const getLandlordPayments = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const result =
      await paymentService.getLandlordPayments(
        req.user.id,
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message:
        "Landlord payments retrieved successfully",
      data: result,
    });
  },
);

/* =========================================================
   GET ALL PAYMENTS
========================================================= */

const getAllPayments = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await paymentService.getAllPaymentsFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "All payments retrieved successfully",
      data: result,
    });
  },
);

/* =========================================================
   EXPORT
========================================================= */

export const paymentController = {
  createCheckoutSession,
  handleWebhook,
  getMyPayments,
  getLandlordPayments,
  getAllPayments,
};