import { Router } from "express";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";
import { dashboardController } from "./dashboard.controller";

const router = Router();
router.get(
  "/admin",
  auth(Role.ADMIN),
  dashboardController.getAdminDashboardStats
);
export const dashboardRoute = router; 