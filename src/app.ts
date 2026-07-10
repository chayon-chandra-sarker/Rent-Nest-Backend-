import express from "express";
import type { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config";
import { globalErrorHandler } from "./errors/globalErrorHandler";
import { authRoutes } from "./modules/auth/auth.route";
import { userRouter } from "./modules/user/user.route";
import { sendResponse } from "./utils/sendResponse";
import httpStatus from "http-status";
import { CategoryRoutes } from "./modules/category/category.route";
import { PropertyRoutes } from "./modules/property/property.route";
import { rentalRequestRoutes } from "./modules/rentalRequest/rentalRequest.route";
import { reviewRoutes } from "./modules/review/review.route";
import { paymentRouter } from "./modules/payment/payment.route";
import { stripe } from "./lib/stripe";
import { dashboardRoute } from "./modules/dashboard/dashboard.route";

const app: Application = express();
app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);

app.use("/api/payment/webhook",  express.raw({type: 'application/json'}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


app.get("/", (req: Request, res: Response) => {
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "RentNest API is running successfully",
    data: {
      name: "RentNest",
      author: "Chayon Chandra Sarker",
    },
  });
});

app.use("/api/auth", userRouter);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRouter);
app.use("/api/category", CategoryRoutes);
app.use("/api/property", PropertyRoutes);
app.use("/api/rental", rentalRequestRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/payment", paymentRouter);
app.use("/api/dashboard", dashboardRoute);

app.use(globalErrorHandler);
export default app;
