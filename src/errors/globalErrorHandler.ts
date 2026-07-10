import type { ErrorRequestHandler } from "express";
import httpStatus from "http-status";
import { ZodError } from "zod";

import AppError from "./AppError";
import { Prisma } from "../../generated/prisma/client";

export const globalErrorHandler: ErrorRequestHandler = (
  error,
  req,
  res,
  next
) => {
  let statusCode: number = 500;
  let message = "Something went wrong!";
  let errorDetails: unknown = null;

  // AppError
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Zod Error
  else if (error instanceof ZodError) {
    statusCode = httpStatus.BAD_REQUEST as number;
    message = "Validation Error";

    errorDetails = error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }

  // Prisma Error
  else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        statusCode = httpStatus.CONFLICT as number;
        message = "This data already exists.";
        break;

      case "P2025":
        statusCode = httpStatus.NOT_FOUND as number;
        message = "Data not found.";
        break;

      case "P2003":
        statusCode = httpStatus.BAD_REQUEST as number;
        message = "Invalid relation data.";
        break;

      default:
        statusCode = httpStatus.BAD_REQUEST as number;
        message = error.message;
    }
  }

  // Normal Error
  else if (error instanceof Error) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR as number;
    message = error.message;
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errorDetails,
    stack:
      process.env.NODE_ENV === "development"
        ? error instanceof Error
          ? error.stack
          : undefined
        : undefined,
  });

  next();
};