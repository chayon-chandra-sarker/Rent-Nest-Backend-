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

const app: Application = express();
app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  }),
);
const endpointSecret = config.strip_webhook_secret;
// app.post("/api/payment/webhook",  express.raw({type: 'application/json'}), (request, response)=> {
//   let event = request.body;
//   console.log(event, "stripe request body");
//   console.log(request.headers, "stripe request header");
//   // Only verify the event if you have an endpoint secret defined.
//   // Otherwise use the basic event deserialized with JSON.parse
//   if (endpointSecret) {
//     // Get the signature sent by Stripe
//     const signature = request.headers['stripe-signature']!;
//     try {
//       event = stripe.webhooks.constructEvent(
//         request.body,
//         signature,
//         endpointSecret
//       );
//     } catch (err:any) {
//       console.log(`⚠️  Webhook signature verification failed.`, err.message);
//       return response.status(400).json({
//         message:err.message
//       })
//     }
//   }
//   console.log(event,"event after try block")
//   // Handle the event
//   switch (event.type) {
//     case 'payment_intent.succeeded':
//       const paymentIntent = event.data.object;
//       console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
//       // Then define and call a method to handle the successful payment intent.
//       // handlePaymentIntentSucceeded(paymentIntent);
//       break;
//     case 'payment_method.attached':
//       const paymentMethod = event.data.object;
//       // Then define and call a method to handle the successful attachment of a PaymentMethod.
//       // handlePaymentMethodAttached(paymentMethod);
//       break;
//     default:
//       // Unexpected event type
//       console.log(`Unhandled event type ${event.type}.`);
//   }

//   // Return a 200 response to acknowledge receipt of the event
//   response.send();
// })
app.use("/api/payment/webhook",  express.raw({type: 'application/json'}))
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

app.use(globalErrorHandler);
export default app;
