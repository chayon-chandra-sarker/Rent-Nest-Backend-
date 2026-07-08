import { z } from "zod";

const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Category name is required")
      .max(100, "Category name cannot exceed 100 characters"),
  }),
});

const updateCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, "Category name is required")
      .max(100, "Category name cannot exceed 100 characters")
      .optional(),
  }),
});

export const CategoryValidation = {
  createCategoryValidationSchema,
  updateCategoryValidationSchema,
};