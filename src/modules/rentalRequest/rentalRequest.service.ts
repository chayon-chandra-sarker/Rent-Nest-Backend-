import httpStatus from "http-status";
import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import { RentalStatus, Role } from "../../../generated/prisma/enums";

const createRentalRequestIntoDB = async (
  tenantId: string,
  propertyId: string,
) => {
  const property = await prisma.property.findUnique({
    where: {
      id: propertyId,
    },
  });

  if (!property) {
    throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  }

  if (!property.isAvailable) {
    throw new AppError(httpStatus.BAD_REQUEST, "Property is not available");
  }

  const alreadyRequested = await prisma.rentalRequest.findFirst({
    where: {
      tenantId,
      propertyId,
      status: "PENDING",
    },
  });

  if (alreadyRequested) {
    throw new AppError(httpStatus.BAD_REQUEST, "Rental request already exists");
  }

  const result = await prisma.rentalRequest.create({
    data: {
      tenantId,
      propertyId,
    },
    include: {
      property: {
        include: {
          category: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          address: true,
          role: true,
        },
      },
    },
  });

  return result;
};

const updateRentalRequestIntoDB = async (
  requestId: string,
  landlordId: string,
  status: RentalStatus
) => {
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      property: true,
    },
  });

  if (!rentalRequest) {
    throw new AppError(httpStatus.NOT_FOUND, "Rental request not found");
  }

 
  if (rentalRequest.property.landlordId !== landlordId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not authorized to update this request"
    );
  }

  const result = await prisma.rentalRequest.update({
    where: {
      id: requestId,
    },
    data: {
      status,
      approvedAt: status === RentalStatus.APPROVED ? new Date() : null,
    },
    include: {
      property: true,
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (status === RentalStatus.APPROVED) {
    await prisma.property.update({
      where: {
        id: rentalRequest.propertyId,
      },
      data: {
        isAvailable: false,
      },
    });
  }

  return result;
};

const getLandlordRequestsFromDB = async (landlordId: string) => {
  const result = await prisma.rentalRequest.findMany({
    where: {
      property: {
        landlordId,
      },
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
          isAvailable: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
    },
    orderBy: {
      requestedAt: "desc",
    },
  });

  return result;
};

const getMyRentalRequestsFromDB = async (tenantId: string) => {
  const result = await prisma.rentalRequest.findMany({
    where: {
      tenantId,
    },
    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
          isAvailable: true,
        },
      },
    },
    orderBy: {
      requestedAt: "desc",
    },
  });

  return result;
};

const getSingleRentalRequestFromDB = async (
  requestId: string,
  userId: string,
  role: Role
) => {
  const result = await prisma.rentalRequest.findUnique({
    where: {
      id: requestId,
    },
    include: {
      property: {
        include: {
          category: true,
        },
      },
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
    },
  });

  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  if (role === Role.TENANT && result.tenantId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  if (
    role === Role.LANDLORD &&
    result.property.landlordId !== userId
  ) {
    throw new AppError(httpStatus.FORBIDDEN, "Access denied");
  }

  return result;
};

const getAllRentalRequestsForAdminFromDB = async () => {
  const result = await prisma.rentalRequest.findMany({
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
        },
      },
      property: {
        include: {
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          category: true,
        },
      },
    },
    orderBy: {
      requestedAt: "desc",
    },
  });

  return result;
};

const getLandlordRentalRequestsFromDB = async (landlordId: string) => {
  const requests = await prisma.rentalRequest.findMany({
    where: {
      property: {
        landlordId,
      },
    },
    include: {
      tenant: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      property: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
        },
      },
      payment: {
        select: {
          status: true,
          paidAt: true,
        },
      },
    },
    orderBy: {
      requestedAt: "desc",
    },
  });

  return requests;
};

export const rentalRequestServices = {
  createRentalRequestIntoDB,
  updateRentalRequestIntoDB,
  getLandlordRequestsFromDB,
  getMyRentalRequestsFromDB,
  getSingleRentalRequestFromDB,
  getAllRentalRequestsForAdminFromDB,
  getLandlordRentalRequestsFromDB,
};
