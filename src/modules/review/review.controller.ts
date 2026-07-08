
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import type { Request, Response } from "express";
import { reviewServices } from "./review.service";
import { sendResponse } from "../../utils/sendResponse";


const createReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
  }

  const result = await reviewServices.createReviewIntoDB(
    req.user.id,
    req.body
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

export const reviewControllers = {
  createReview,
};