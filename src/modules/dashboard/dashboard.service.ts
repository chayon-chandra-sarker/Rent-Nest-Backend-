import { prisma } from "../../lib/prisma";

const getAdminDashboardStatsFromDB = async () => {
  const [
    totalUsers,
    totalProperties,
    totalRentalRequests,
    completedPayments,
    totalRevenue,
    completedPaymentHistory,
    pendingRentalRequests,
    approvedRentalRequests,
    activeRentalRequests,
    completedRentalRequests,
    rejectedRentalRequests,
  ] = await Promise.all([
    // Total users
    prisma.user.count(),

    // Total properties
    prisma.property.count(),

    // Total rental requests
    prisma.rentalRequest.count(),

    // Completed payments count
    prisma.payment.count({
      where: {
        status: "COMPLETED",
      },
    }),

    // Total revenue
    prisma.payment.aggregate({
      where: {
        status: "COMPLETED",
      },
      _sum: {
        amount: true,
      },
    }),

    // Completed payment history
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

    // Pending rental requests
    prisma.rentalRequest.count({
      where: {
        status: "PENDING",
      },
    }),

    // Approved rental requests
    prisma.rentalRequest.count({
      where: {
        status: "APPROVED",
      },
    }),

    // Active rental requests
    prisma.rentalRequest.count({
      where: {
        status: "ACTIVE",
      },
    }),

    // Completed rental requests
    prisma.rentalRequest.count({
      where: {
        status: "COMPLETED",
      },
    }),

    // Rejected rental requests
    prisma.rentalRequest.count({
      where: {
        status: "REJECTED",
      },
    }),
  ]);

  // ================================
  // Monthly Revenue Calculation
  // ================================

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

  // ================================
  // Final Dashboard Response
  // ================================

  return {
    totalUsers,
    totalProperties,
    totalRentalRequests,

    totalRevenue: totalRevenue._sum.amount ?? 0,

    completedPayments,

    monthlyRevenue,

    rentalRequests: {
      pending: pendingRentalRequests,
      approved: approvedRentalRequests,
      active: activeRentalRequests,
      completed: completedRentalRequests,
      rejected: rejectedRentalRequests,
    },
  };
};

export const dashboardService = {
  getAdminDashboardStatsFromDB,
};