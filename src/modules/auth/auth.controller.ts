import type { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { authService } from "./auth.service";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const { accessToken, refreshToken } =
    await authService.loginUser(payload);

  // Access Token Cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24,
  });

  // Refresh Token Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
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
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {

  const { idToken } = req.body;


  if (!idToken) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.BAD_REQUEST,
      message: "Google ID token is required",
      data: null,
    });
  }

  const { accessToken, refreshToken } =
    await authService.googleLogin(idToken);

  // Access Token Cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24,
  });

  // Refresh Token Cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Google login successful",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
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

  // New Access Token Cookie
  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: true,
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
});


const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User logged out successfully",
    data: null,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    return sendResponse(res, {
      success: false,
      statusCode: httpStatus.UNAUTHORIZED,
      message: "Unauthorized",
      data: null,
    });
  }

  const user = await authService.getMe(req.user.id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User profile retrieved successfully",
    data: user,
  });
});

export const authController = {
  loginUser,
  googleLogin,
  refreshToken,
  logout,
  getMe,
};