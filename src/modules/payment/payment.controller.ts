import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";


const createCheckoutSession = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    const result = await paymentService.createCheckoutSession(userId as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Checkout session created successfully",
      data: result,
    });
  },
);


const handleWebhook = catchAsync(async(req: Request, res:Response, next:NextFunction) => {
  const event = req.body as Buffer;
   const signature = req.headers['stripe-signature']!;
   await paymentService.handleWebhook(event, signature as string)

   sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "webhook triggered created successfully",
    data: null,
   })
});
export const paymentController = {
  createCheckoutSession,
  handleWebhook,
};
