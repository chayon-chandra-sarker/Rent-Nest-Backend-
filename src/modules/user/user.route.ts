import { Router } from "express";
import { userController } from "./user.controller";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";




const router = Router();

router.post("/register", userController.registerUser);

router.get("/me",auth(Role.ADMIN,Role.LANDLORD, Role.TENANT), userController.getMyProfile);

router.put("/update",auth(Role.ADMIN, Role.LANDLORD, Role.TENANT), userController.updateMyProfile);


export const userRouter = router;