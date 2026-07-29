import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";


const loginUser = catchAsync(
  async (req: Request, res: Response) => {
    const payload = req.body;

    const { accessToken, refreshToken } =
      await authService.loginUser(payload);


    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, 
    });


    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7, 
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "User logged in successfully",
      data: {
        accessToken,
        refreshToken,
      },
    });
  }
);



const refreshToken = catchAsync(
  async (req: Request, res: Response) => {

    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return sendResponse(res, {
        success: false,
        statusCode: httpStatus.UNAUTHORIZED,
        message: "Refresh token is missing",
        data: null,
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.cookie("accessToken", result.accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24, 
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Access token refreshed successfully",
      data: {
        accessToken: result.accessToken,
      },
    });
  }
);


export const authController = {
  loginUser,
  refreshToken,
};