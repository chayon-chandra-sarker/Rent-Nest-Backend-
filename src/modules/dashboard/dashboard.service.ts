
import { prisma } from "../../lib/prisma";
const getAdminDashboardStatsFromDB = async () => {
  const [
    totalUsers,
    totalProperties,
    totalRentalRequests,
    completedPayments,
    totalRevenue,
  ] = await Promise.all([
    prisma.user.count(),

    prisma.property.count(),

    prisma.rentalRequest.count(),

    prisma.payment.count({
      where: {
        status: "COMPLETED",
      },
    }),

    prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  return {
    totalUsers,
    totalProperties,
    totalRentalRequests,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    completedPayments,
  };
};

export const dashboardService = {
  getAdminDashboardStatsFromDB,
};