
import httpStatus from "http-status";

import AppError from "../../errors/AppError";
import { prisma } from "../../lib/prisma";

import type { TReview } from "./review.interface";

const createReviewIntoDB = async (
  tenantId: string,
  payload: TReview,
) => {
  /* Check property */

  const property = await prisma.property.findUnique({
    where: {
      id: payload.propertyId,
    },
  });

  if (!property) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Property not found",
    );
  }

  /* Check duplicate review */

  const alreadyReviewed =
    await prisma.review.findFirst({
      where: {
        tenantId,
        propertyId: payload.propertyId,
      },
    });

  if (alreadyReviewed) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You have already reviewed this property.",
    );
  }

  /* Create review */

  const result = await prisma.review.create({
    data: {
      tenantId,
      propertyId: payload.propertyId,
      rating: payload.rating,
      comment: payload.comment,
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
        },
      },
    },
  });

  return result;
};

const getMyReviewsFromDB = async (
  tenantId: string,
) => {
  const reviews = await prisma.review.findMany({
    where: {
      tenantId,
    },

    include: {
      property: {
        select: {
          id: true,
          title: true,
          location: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews;
};

const updateReviewIntoDB = async (
  tenantId: string,
  reviewId: string,
  payload: Partial<TReview>,
) => {
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });

  if (!review) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Review not found",
    );
  }

  /* Ownership check */

  if (review.tenantId !== tenantId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only update your own review.",
    );
  }

  const result = await prisma.review.update({
    where: {
      id: reviewId,
    },

    data: {
      ...(payload.rating !== undefined && {
        rating: payload.rating,
      }),

      ...(payload.comment !== undefined && {
        comment: payload.comment,
      }),
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
        },
      },
    },
  });

  return result;
};

const deleteReviewFromDB = async (
  tenantId: string,
  reviewId: string,
) => {
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });

  if (!review) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Review not found",
    );
  }

  /* Ownership check */

  if (review.tenantId !== tenantId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You can only delete your own review.",
    );
  }

  await prisma.review.delete({
    where: {
      id: reviewId,
    },
  });

  return null;
};

const getAllReviewsFromDB = async () => {
  const reviews = await prisma.review.findMany({
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
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return reviews;
};


const adminDeleteReviewFromDB = async (
  reviewId: string,
) => {
  const review = await prisma.review.findUnique({
    where: {
      id: reviewId,
    },
  });

  if (!review) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Review not found",
    );
  }

  await prisma.review.delete({
    where: {
      id: reviewId,
    },
  });

  return null;
};

export const reviewServices = {
  createReviewIntoDB,
  getMyReviewsFromDB,
  updateReviewIntoDB,
  deleteReviewFromDB,
  getAllReviewsFromDB,
  adminDeleteReviewFromDB,
};

