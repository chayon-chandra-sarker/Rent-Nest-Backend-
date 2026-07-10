import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();
router.post("/checkout", auth(Role.TENANT), 
paymentController.createCheckoutSession);

router.post("/webhook", paymentController.handleWebhook);

router.get(
  "/my-payments",
  auth(Role.TENANT),
  paymentController.getMyPayments
);

router.get(
  "/all-payments",
  auth(Role.ADMIN),
  paymentController.getAllPayments
);

export const paymentRouter = router;