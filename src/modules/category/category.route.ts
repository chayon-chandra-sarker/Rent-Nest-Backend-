import express from "express";
import { CategoryControllers } from "./category.controller";
import validateRequest from "../../middleware/validateRequest";
import { CategoryValidation } from "./category.validation";
import { auth } from "../../middleware/auth";
import { Role } from "../../../generated/prisma/enums";

const router = express.Router();

router.post(
  "/create",
  auth(Role.ADMIN),
  validateRequest(CategoryValidation.createCategoryValidationSchema),
  CategoryControllers.createCategory
);


router.get("/all-categories", CategoryControllers.getAllCategories);

router.get("/single/:id", CategoryControllers.getSingleCategory);

router.put(
  "/update/:id",
  auth(Role.ADMIN),
  validateRequest(CategoryValidation.updateCategoryValidationSchema),
  CategoryControllers.updateCategory
);


router.delete(
  "/delete/:id",
  auth(Role.ADMIN),
  CategoryControllers.deleteCategory
);

export const CategoryRoutes = router;