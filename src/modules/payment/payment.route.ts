
import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
  "/checkout",
  auth(Role.TENANT),
  paymentController.createCheckoutSession,
);

router.post(
  "/webhook",
  paymentController.handleWebhook,
);

router.post(
  "/verify-session",
  auth(),
  paymentController.verifyCheckoutSession,
);

router.get(
  "/my-payments",
  auth(Role.TENANT),
  paymentController.getMyPayments,
);

router.get(
  "/landlord-payments",
  auth(Role.LANDLORD),
  paymentController.getLandlordPayments,
);

router.get(
  "/all-payments",
  auth(Role.ADMIN),
  paymentController.getAllPayments,
);

export const paymentRouter = router;

