
import { Router } from "express";

import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { reviewControllers } from "./review.controller";

const router = Router();

router.post(
  "/create",
  auth(Role.TENANT),
  reviewControllers.createReview,
);

router.get(
  "/my-reviews",
  auth(Role.TENANT),
  reviewControllers.getMyReviews,
);

router.put(
  "/user/:id",
  auth(Role.TENANT),
  reviewControllers.updateReview,
);

router.delete(
  "/user/:id",
  auth(Role.TENANT),
  reviewControllers.deleteReview,
);

router.get(
  "/all-reviews",
  reviewControllers.getAllReviews,
);

router.get(
  "/admin/all-reviews",
  auth(Role.ADMIN),
  reviewControllers.getAllReviews,
);

router.delete(
  "/admin/:id",
  auth(Role.ADMIN),
  reviewControllers.adminDeleteReview,
);

export const reviewRoutes = router;

