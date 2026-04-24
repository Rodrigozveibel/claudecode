import { prisma } from '../../config/database';
import { eachDayOfInterval, format, startOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export async function getOccupancyReport(
  propertyId: string,
  startDate: Date,
  endDate: Date,
  groupBy: 'daily' | 'weekly' | 'monthly' = 'daily'
) {
  const totalRooms = await prisma.room.count({ where: { propertyId, isActive: true } });
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const dailyData = await Promise.all(
    days.map(async (day) => {
      const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
      const occupied = await prisma.reservation.count({
        where: {
          propertyId,
          status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
          checkIn: { lt: nextDay },
          checkOut: { gt: day },
        },
      });

      return {
        date: format(day, 'yyyy-MM-dd'),
        occupied,
        total: totalRooms,
        rate: totalRooms > 0 ? parseFloat(((occupied / totalRooms) * 100).toFixed(2)) : 0,
      };
    })
  );

  if (groupBy === 'daily') return dailyData;

  return dailyData;
}

export async function getRevenueReport(propertyId: string, startDate: Date, endDate: Date) {
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
      checkIn: { gte: startDate, lte: endDate },
    },
    select: {
      checkIn: true,
      totalAmount: true,
      roomRate: true,
      source: true,
      nightsCount: true,
    },
  });

  const payments = await prisma.payment.findMany({
    where: {
      propertyId,
      status: 'COMPLETED',
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const totalRevenue = reservations.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const bySource = reservations.reduce((acc, r) => {
    acc[r.source] = (acc[r.source] || 0) + r.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  const byDay: Record<string, number> = {};
  for (const r of reservations) {
    const key = format(r.checkIn, 'yyyy-MM-dd');
    byDay[key] = (byDay[key] || 0) + r.totalAmount;
  }

  return {
    totalRevenue,
    totalPaid,
    outstanding: totalRevenue - totalPaid,
    totalReservations: reservations.length,
    bySource,
    byDay,
  };
}

export async function getGuestReport(propertyId: string, startDate: Date, endDate: Date) {
  const [newGuests, returningGuests, totalGuests] = await Promise.all([
    prisma.guest.count({
      where: {
        propertyId,
        createdAt: { gte: startDate, lte: endDate },
      },
    }),
    prisma.guest.count({
      where: {
        propertyId,
        totalStays: { gt: 1 },
        reservations: {
          some: {
            checkIn: { gte: startDate, lte: endDate },
          },
        },
      },
    }),
    prisma.guest.count({ where: { propertyId } }),
  ]);

  const topGuests = await prisma.guest.findMany({
    where: { propertyId },
    orderBy: { totalSpent: 'desc' },
    take: 10,
    select: {
      firstName: true,
      lastName: true,
      email: true,
      totalStays: true,
      totalSpent: true,
      loyaltyPoints: true,
    },
  });

  const nationalities = await prisma.guest.groupBy({
    by: ['nationality'],
    where: { propertyId, nationality: { not: null } },
    _count: true,
    orderBy: { _count: { nationality: 'desc' } },
    take: 10,
  });

  return {
    newGuests,
    returningGuests,
    totalGuests,
    topGuests,
    nationalities,
  };
}

export async function getSourceReport(propertyId: string, startDate: Date, endDate: Date) {
  const sourceData = await prisma.reservation.groupBy({
    by: ['source'],
    where: {
      propertyId,
      createdAt: { gte: startDate, lte: endDate },
    },
    _count: true,
    _sum: { totalAmount: true },
  });

  return sourceData.map((s) => ({
    source: s.source,
    count: s._count,
    revenue: s._sum.totalAmount ?? 0,
  }));
}

export async function getHousekeepingReport(propertyId: string, startDate: Date, endDate: Date) {
  const tasks = await prisma.housekeepingTask.findMany({
    where: {
      propertyId,
      scheduledDate: { gte: startDate, lte: endDate },
    },
    include: {
      room: { select: { number: true, floor: true } },
      assignee: { select: { name: true } },
    },
  });

  const byStatus = tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byType = tasks.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgCompletionTime = tasks
    .filter((t) => t.startedAt && t.completedAt)
    .map((t) => t.completedAt!.getTime() - t.startedAt!.getTime())
    .reduce((sum, d, _, arr) => sum + d / arr.length, 0);

  return {
    total: tasks.length,
    byStatus,
    byType,
    avgCompletionTimeMinutes: Math.round(avgCompletionTime / 60000),
    tasks,
  };
}

export async function getMaintenanceReport(propertyId: string, startDate: Date, endDate: Date) {
  const requests = await prisma.maintenanceRequest.findMany({
    where: {
      propertyId,
      createdAt: { gte: startDate, lte: endDate },
    },
    include: {
      room: { select: { number: true, floor: true } },
      assignee: { select: { name: true } },
    },
  });

  const byStatus = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byCategory = requests.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: requests.length,
    byStatus,
    byCategory,
    requests,
  };
}

export async function getFinancialSummary(propertyId: string, startDate: Date, endDate: Date) {
  const [revenue, payments, invoiceStats] = await Promise.all([
    prisma.reservation.aggregate({
      where: {
        propertyId,
        status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { gte: startDate, lte: endDate },
      },
      _sum: { totalAmount: true, paidAmount: true },
      _count: true,
      _avg: { roomRate: true },
    }),
    prisma.payment.groupBy({
      by: ['method'],
      where: {
        propertyId,
        status: 'COMPLETED',
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.invoice.groupBy({
      by: ['status'],
      where: {
        propertyId,
        createdAt: { gte: startDate, lte: endDate },
      },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  return {
    grossRevenue: revenue._sum.totalAmount ?? 0,
    collectedRevenue: revenue._sum.paidAmount ?? 0,
    outstandingRevenue: (revenue._sum.totalAmount ?? 0) - (revenue._sum.paidAmount ?? 0),
    avgDailyRate: parseFloat((revenue._avg.roomRate ?? 0).toFixed(2)),
    totalReservations: revenue._count,
    paymentsByMethod: payments.map((p) => ({
      method: p.method,
      amount: p._sum.amount ?? 0,
      count: p._count,
    })),
    invoicesByStatus: invoiceStats.map((i) => ({
      status: i.status,
      amount: i._sum.total ?? 0,
      count: i._count,
    })),
  };
}

export async function exportReport(
  propertyId: string,
  reportType: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  let data: unknown[] = [];

  if (reportType === 'occupancy') {
    data = await getOccupancyReport(propertyId, startDate, endDate);
  } else if (reportType === 'source') {
    data = await getSourceReport(propertyId, startDate, endDate);
  }

  if (!Array.isArray(data) || data.length === 0) return '';

  const headers = Object.keys(data[0] as object).join(',');
  const rows = data.map((row) =>
    Object.values(row as object)
      .map((v) => (typeof v === 'string' && v.includes(',') ? `"${v}"` : v))
      .join(',')
  );

  return [headers, ...rows].join('\n');
}
