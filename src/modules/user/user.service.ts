import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import type { registerUserPayload, UpdateProfilePayload } from "./user.interface";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";
import type { Role } from "../../../generated/prisma/enums";





const registerUserIntoDB = async (payload: registerUserPayload) => {
  const { name, email, password } = payload;
  const isUserExist = await prisma.user.findUnique({
    where: { email },
  });

  if (isUserExist) {
    throw new AppError(
      httpStatus.CONFLICT,
      "User with this email already exists",
    );
  }
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  const user = await prisma.user.findUnique({
    where: {
      id: createdUser.id,
      email: createdUser.email || email,
    },
    omit: {
      password: true,
    },
  });
  return user;
};

const getMyProfileFromDB = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      image: true,
      address: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  return user;
};

const updateMyProfileIntoDB = async (
  userId: string,
  payload: UpdateProfilePayload
) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const updateData: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    updateData.name = payload.name;
  }

  if (payload.phone !== undefined) {
    updateData.phone = payload.phone;
  }

  if (payload.image !== undefined) {
    updateData.image = payload.image;
  }

  if (payload.address !== undefined) {
    updateData.address = payload.address;
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: userId,
    },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      image: true,
      address: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return updatedUser;
};

const updateUserRoleIntoDB = async (
  id: string,
  role: Role
) => {
  const isUserExist = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!isUserExist) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      role,
    },
  });

  return result;
};


export const userService = {
  registerUserIntoDB,
  getMyProfileFromDB,
  updateMyProfileIntoDB,
  updateUserRoleIntoDB,
};
