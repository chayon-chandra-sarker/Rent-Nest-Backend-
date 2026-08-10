import { prisma } from "../../lib/prisma";

const getAdminDashboardStatsFromDB = async () => {
  const [
    totalUsers,
    totalProperties,
    totalRentalRequests,
    completedPayments,
    totalRevenue,
    completedPaymentHistory,
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

    prisma.payment.findMany({
      where: {
        status: "COMPLETED",
        paidAt: {
          not: null,
        },
      },
      select: {
        amount: true,
        paidAt: true,
      },
      orderBy: {
        paidAt: "asc",
      },
    }),
  ]);

  // Monthly revenue calculation
  const monthlyRevenueMap: Record<string, number> = {};

  completedPaymentHistory.forEach((payment) => {
    if (!payment.paidAt) return;

    const month = payment.paidAt.toLocaleString("en-US", {
      month: "short",
    });

    const amount = Number(payment.amount);

    monthlyRevenueMap[month] =
      (monthlyRevenueMap[month] || 0) + amount;
  });

  const monthlyRevenue = Object.entries(monthlyRevenueMap).map(
    ([month, revenue]) => ({
      month,
      revenue,
    }),
  );

  return {
    totalUsers,
    totalProperties,
    totalRentalRequests,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    completedPayments,
    monthlyRevenue,
  };
};

export const dashboardService = {
  getAdminDashboardStatsFromDB,
};