import { Router } from "express";
import { userController } from "./user.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";




const router = Router();

router.post("/register", userController.registerUser);

router.get("/me",auth(Role.ADMIN,Role.LANDLORD, Role.TENANT), userController.getMyProfile);

router.put("/update",auth(Role.ADMIN, Role.LANDLORD, Role.TENANT), userController.updateMyProfile);
router.put(
  "/:id/role",
  auth(Role.ADMIN),
  userController.updateUserRole
);

router.get(
  "/admin/all-users",
  auth(Role.ADMIN),
  userController.getAllUsers
);

router.put(
  "/admin/update/:id",
  auth(Role.ADMIN),
 userController.updateUserStatus
);

export const userRouter = router;