
import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import type { Request, Response } from "express";

import { reviewServices } from "./review.service";
import { sendResponse } from "../../utils/sendResponse";

const createReview = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const result =
      await reviewServices.createReviewIntoDB(
        req.user.id,
        req.body,
      );

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Review created successfully",
      data: result,
    });
  },
);

const getMyReviews = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const result =
      await reviewServices.getMyReviewsFromDB(
        req.user.id,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My reviews retrieved successfully",
      data: result,
    });
  },
);

const updateReview = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const { id } = req.params;

    const result =
      await reviewServices.updateReviewIntoDB(
        req.user.id,
        id as string,
        req.body,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review updated successfully",
      data: result,
    });
  },
);

const deleteReview = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const { id } = req.params;

    const result =
      await reviewServices.deleteReviewFromDB(
        req.user.id,
        id as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review deleted successfully",
      data: result,
    });
  },
);

const getPropertyReviews = catchAsync(
  async (req: Request, res: Response) => {
    const { propertyId } = req.params;

    const result =
      await reviewServices.getPropertyReviewsFromDB(
        propertyId as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message:
        "Property reviews retrieved successfully",
      data: result,
    });
  },
);

const getAllReviews = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const result =
      await reviewServices.getAllReviewsFromDB();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All reviews retrieved successfully",
      data: result,
    });
  },
);


const adminDeleteReview = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const { id } = req.params;

    const result =
      await reviewServices.adminDeleteReviewFromDB(
        id as string,
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Review deleted successfully",
      data: result,
    });
  },
);


export const reviewControllers = {
  createReview,
  getMyReviews,
  updateReview,
  deleteReview,
  getPropertyReviews,
  getAllReviews,
  adminDeleteReview,
};

