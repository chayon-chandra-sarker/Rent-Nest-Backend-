
import httpStatus from "http-status";
import { CategoryServices } from "./category.service";
import { catchAsync } from "../../utils/catchAsync";
import type { Request, Response } from "express";
import { sendResponse } from "../../utils/sendResponse";
import AppError from "../../errors/AppError";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.createCategoryIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Category created successfully",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const result = await CategoryServices.getAllCategoriesFromDB();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Categories retrieved successfully",
    data: result,
  });
});

const getSingleCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new AppError(httpStatus.BAD_REQUEST, "Category ID is required");
  }

 const result = await CategoryServices.getSingleCategoryFromDB(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category retrieved successfully",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await CategoryServices.updateCategoryIntoDB(id as string, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category updated successfully",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await CategoryServices.deleteCategoryFromDB(id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Category deleted successfully",
    data: null,
  });
});

export const CategoryControllers = {
  createCategory,
  getAllCategories,
  getSingleCategory,
  updateCategory,
  deleteCategory,
};