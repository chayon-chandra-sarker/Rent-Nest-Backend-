import { Router } from "express";

import { landlordRequestController } from "./landlord-request.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();


router.post(
  "/request",
  auth(Role.TENANT),
  landlordRequestController.createLandlordRequest,
);

router.get(
  "/all-requests",
  auth(Role.ADMIN),
  landlordRequestController.getAllLandlordRequests,
);

router.put(
  "/status/:requestId",
  auth(Role.ADMIN),
  landlordRequestController.updateLandlordRequestStatus,
);

export const landlordRequestRouter = router;