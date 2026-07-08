import { Router } from "express";
import { rentalRequestControllers } from "./rentalRequest.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";



const router = Router();

router.post(
  "/create",
  auth(Role.TENANT),
  rentalRequestControllers.createRentalRequest
);

router.put(
  "/update/:id",
  auth(Role.LANDLORD),
  rentalRequestControllers.updateRentalRequest
);

router.get(
  "/landlord/requests",
  auth(Role.LANDLORD),
  rentalRequestControllers.getLandlordRequests
);

router.get(
  "/requests",
  auth(Role.TENANT),
  rentalRequestControllers.getMyRentalRequests
);

router.get(
  "/single/:id",
  auth(Role.TENANT, Role.LANDLORD),
  rentalRequestControllers.getSingleRentalRequest
);

router.get(
  "/admin/rentals",
  auth(Role.ADMIN),
  rentalRequestControllers.getAllRentalRequestsForAdmin
);

export const rentalRequestRoutes = router;