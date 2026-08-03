import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errors/AppError";
import { landlordRequestServices } from "./landlord-request.service";

const createLandlordRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "Unauthorized",
      );
    }

    const result =
      await landlordRequestServices.createLandlordRequestIntoDB(
        userId,
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message:
        "Landlord request submitted successfully",
      data: result,
    });
  },
);

const getAllLandlordRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await landlordRequestServices.getAllLandlordRequestsFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message:
        "Landlord requests retrieved successfully",
      data: result,
    });
  },
);

const updateLandlordRequestStatus = catchAsync(
  async (req: Request, res: Response) => {
    const requestId = req.params.requestId as string;
    const { status } = req.body;

    if (!requestId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Request ID is required",
      );
    }

    if (!status) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Status is required",
      );
    }

    if (
      status !== "APPROVED" &&
      status !== "REJECTED"
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Status must be APPROVED or REJECTED",
      );
    }

    const result =
      await landlordRequestServices.updateLandlordRequestStatus(
        requestId,
        status,
      );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message:
        status === "APPROVED"
          ? "Landlord request approved successfully"
          : "Landlord request rejected successfully",
      data: result,
    });
  },
);

export const landlordRequestController = {
  createLandlordRequest,
  getAllLandlordRequests,
  updateLandlordRequestStatus,
};