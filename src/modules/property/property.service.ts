
import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import type { Prisma } from "../../../generated/prisma/client";
import type { propertyPayload } from "./property.interface";



const createPropertyIntoDB = async (
  userId: string,
  payload: propertyPayload
) => {
  const result = await prisma.property.create({
    data: {
      ...payload,
      landlordId: userId,
    },
    include: {
      landlord: true,
      category: true,
    },
  });

  return result;
};

const getAllPropertiesFromDB = async () => {
const result = await prisma.property.findMany({
  include: {
    landlord: {
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    },
    category: true,
  },
  orderBy: {
    createdAt: "desc",
  },
});

  return result;
};

const getSinglePropertyFromDB = async (id: string) => {
  const result = await prisma.property.findUnique({
    where: {
      id,
    },
    include: {
      landlord: true,
      category: true,
      reviews: true,
      rentalRequests: true,
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  return result;
};

const updatePropertyIntoDB = async (
  id: string,
  payload: Prisma.PropertyUpdateInput
) => {
  const isExist = await prisma.property.findUnique({
    where: {
      id,
    },
  });

  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  const result = await prisma.property.update({
    where: {
      id,
    },
    data: payload,
    include: {
      landlord: true,
      category: true,
    },
  });

  return result;
};

const deletePropertyFromDB = async (id: string) => {
  const isExist = await prisma.property.findUnique({
    where: {
      id,
    },
  });

  if (!isExist) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  await prisma.property.delete({
    where: {
      id,
    },
  });

  return null;
};

const getAllPropertiesForAdminFromDB = async () => {
  const result = await prisma.property.findMany({
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
        },
      },
      category: true,
      _count: {
        select: {
          rentalRequests: true,
          reviews: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

export const PropertyServices = {
  createPropertyIntoDB,
  getAllPropertiesFromDB,
  getSinglePropertyFromDB,
  updatePropertyIntoDB,
  deletePropertyFromDB,
  getAllPropertiesForAdminFromDB,
};