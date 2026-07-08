import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const createCategoryIntoDB = async (payload: Prisma.CategoryCreateInput) => {
  const isCategoryExist = await prisma.category.findUnique({
    where: {
      name: payload.name,
    },
  });

  if (isCategoryExist) {
    throw new AppError(httpStatus.BAD_REQUEST, "Category already exists");
  }

  const result = await prisma.category.create({
    data: payload,
  });

  return result;
};

const getAllCategoriesFromDB = async () => {
  const result = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          properties: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getSingleCategoryFromDB = async (id: string) => {
  const result = await prisma.category.findUnique({
    where: {
      id,
    },
    include: {
      properties: true, 
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  return result;
};

const updateCategoryIntoDB = async (
  id: string,
  payload: {
    name?: string;
  }
) => {
  // Check category exists
  const isCategoryExist = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!isCategoryExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  // Check duplicate name
  if (payload.name) {
    const isNameExist = await prisma.category.findFirst({
      where: {
        name: payload.name,
        NOT: {
          id,
        },
      },
    });

    if (isNameExist) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Category name already exists"
      );
    }
  }

  const result = await prisma.category.update({
    where: {
      id,
    },
    data: payload,
  });

  return result;
};

const deleteCategoryFromDB = async (id: string) => {
  const isCategoryExist = await prisma.category.findUnique({
    where: {
      id,
    },
  });

  if (!isCategoryExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");
  }

  const result = await prisma.category.delete({
    where: {
      id,
    },
  });

  return result;
};

export const CategoryServices = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  getSingleCategoryFromDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};