import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { dashboardService } from "./dashboard.service";
import { sendResponse } from "../../utils/sendResponse";

const getAdminDashboardStats = catchAsync(async (req:Request, res:Response, next:NextFunction) => {
  const result = await dashboardService.getAdminDashboardStatsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Admin dashboard statistics retrieved successfully",
    data: result,
  });
});

export const dashboardController = {
  getAdminDashboardStats,
};