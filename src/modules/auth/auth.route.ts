
import { Router } from "express";
import { authController } from "./auth.controller";
import { auth } from "../../middleware/auth";

const router = Router();

router.post("/login", authController.loginUser);

router.post("/google", authController.googleLogin);
router.post("/logout", authController.logout);
router.get("/me", auth(), authController.getMe);

router.post("/refresh-token", authController.refreshToken);

export const authRoutes = router;

