import httpStatus from "http-status";

import { prisma } from "../../lib/prisma";
import AppError from "../../errors/AppError";

const createLandlordRequestIntoDB = async (
  userId: string,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "User not found",
    );
  }

  if (user.role === "LANDLORD") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You are already a landlord",
    );
  }

  const existingRequest =
    await prisma.landlordRequest.findUnique({
      where: {
        userId,
      },
    });

  if (existingRequest) {
    if (existingRequest.status === "PENDING") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Your landlord request is already pending",
      );
    }

    if (existingRequest.status === "APPROVED") {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Your landlord request has already been approved",
      );
    }

    const updatedRequest =
      await prisma.landlordRequest.update({
        where: {
          userId,
        },

        data: {
          status: "PENDING",
        },

        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              status: true,
            },
          },
        },
      });

    return updatedRequest;
  }

  const newRequest =
    await prisma.landlordRequest.create({
      data: {
        userId,
        status: "PENDING",
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

  return newRequest;
};


const getAllLandlordRequestsFromDB = async () => {
  const requests =
    await prisma.landlordRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
            address: true,
            role: true,
            status: true,
            createdAt: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return requests;
};

const updateLandlordRequestStatus = async (
  requestId: string,
  status: "APPROVED" | "REJECTED",
) => {
  const request =
    await prisma.landlordRequest.findUnique({
      where: {
        id: requestId,
      },
    });

  if (!request) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Landlord request not found",
    );
  }

  if (request.status !== "PENDING") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Request is already ${request.status.toLowerCase()}`,
    );
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const updatedRequest =
        await tx.landlordRequest.update({
          where: {
            id: requestId,
          },

          data: {
            status,
          },
        });

      if (status === "APPROVED") {
        await tx.user.update({
          where: {
            id: request.userId,
          },

          data: {
            role: "LANDLORD",
          },
        });
      }

      const finalRequest =
        await tx.landlordRequest.findUnique({
          where: {
            id: requestId,
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                address: true,
                role: true,
                status: true,
                createdAt: true,
              },
            },
          },
        });

      return finalRequest;
    },
  );

  return result;
};

export const landlordRequestServices = {
  createLandlordRequestIntoDB,
  getAllLandlordRequestsFromDB,
  updateLandlordRequestStatus,
};