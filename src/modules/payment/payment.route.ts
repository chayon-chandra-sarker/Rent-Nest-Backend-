import { Router } from "express";
import { paymentController } from "./payment.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();
router.post("/checkout", auth(Role.TENANT), 
paymentController.createCheckoutSession)

export const paymentRouter = router;