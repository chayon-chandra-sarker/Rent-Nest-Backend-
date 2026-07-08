import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { reviewControllers } from "./review.controller";


const router = Router();

router.post(
  "/create",
  auth(Role.TENANT),
  reviewControllers.createReview
);

export const reviewRoutes = router;