
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import type { Request, Response } from "express";
import { rentalRequestServices } from "./rentalRequest.service";
import { sendResponse } from "../../utils/sendResponse";

const createRentalRequest = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result =
      await rentalRequestServices.createRentalRequestIntoDB(
        req.user.id,
        req.body.propertyId
        
      );
     
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "Rental request created successfully",
      data: result,
    });
  }
);

const updateRentalRequest = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const { id } = req.params;
    const { status } = req.body;

    const result = await rentalRequestServices.updateRentalRequestIntoDB(
      id as string,
      req.user.id,
      status
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Rental request updated successfully",
      data: result,
    });
  }
);

const getLandlordRequests = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await rentalRequestServices.getLandlordRequestsFromDB(
      req.user.id
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Rental requests retrieved successfully",
      data: result,
    });
  }
);

const getMyRentalRequests = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result = await rentalRequestServices.getMyRentalRequestsFromDB(
      req.user.id
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "My rental requests retrieved successfully",
      data: result,
    });
  }
);

const getSingleRentalRequest = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized");
    }

    const result =
      await rentalRequestServices.getSingleRentalRequestFromDB(
        req.params.id as string,
        req.user.id,
        req.user.role
      );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Rental request retrieved successfully",
      data: result,
    });
  }
);

const getAllRentalRequestsForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await rentalRequestServices.getAllRentalRequestsForAdminFromDB();

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "All rental requests retrieved successfully",
      data: result,
    });
  }
);
export const rentalRequestControllers = {
  createRentalRequest,
  updateRentalRequest,
  getLandlordRequests,
  getMyRentalRequests,
  getSingleRentalRequest,
  getAllRentalRequestsForAdmin,

};