import type { NextFunction, Request, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import httpStatus from "http-status";
import type { Role } from "../../generated/prisma/enums";
import { prisma } from "../lib/prisma";
import { jwtUtils } from "../utils/jwt";
import { catchAsync } from "../utils/catchAsync";
import AppError from "../errors/AppError";
import config from "../config";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: Role;
      };
    }
  }
}

export const auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const token =
      req.cookies.accessToken
        ? req.cookies.accessToken
        : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        "You are not logged in. Please log in to access this resource."
      );
    }

    const decoded = jwtUtils.verifiedToken(
      token,
      config.jwt_access_secret
    ) as JwtPayload;

    const { id, email, name, role } = decoded;

    if (requiredRoles.length && !requiredRoles.includes(role)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You don't have permission to access this resource."
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!user) {
      throw new AppError(
        httpStatus.NOT_FOUND,
        "User not found. Please login again."
      );
    }

    if (user.status === "BANNED") {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account has been blocked. Please contact support."
      );
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  });
};