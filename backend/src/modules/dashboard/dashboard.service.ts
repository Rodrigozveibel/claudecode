import { prisma } from '../../config/database';
import { startOfDay, endOfDay, startOfMonth, subDays, format, eachDayOfInterval } from 'date-fns';

export async function getDashboardStats(propertyId: string) {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const monthStart = startOfMonth(today);

  const [
    totalRooms,
    todayArrivals,
    todayDepartures,
    occupiedRooms,
    revenueToday,
    revenueMonth,
    pendingHousekeeping,
    openMaintenance,
    roomStatusCounts,
  ] = await Promise.all([
    prisma.room.count({ where: { propertyId, isActive: true } }),
    prisma.reservation.count({
      where: { propertyId, checkIn: { gte: todayStart, lte: todayEnd }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
    }),
    prisma.reservation.count({
      where: { propertyId, checkOut: { gte: todayStart, lte: todayEnd }, status: { in: ['CHECKED_IN', 'CHECKED_OUT'] } },
    }),
    prisma.reservation.count({
      where: { propertyId, status: 'CHECKED_IN', checkIn: { lte: todayEnd }, checkOut: { gte: todayStart } },
    }),
    prisma.reservation.aggregate({
      _sum: { totalAmount: true },
      where: { propertyId, status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }, checkIn: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.reservation.aggregate({
      _sum: { totalAmount: true },
      where: { propertyId, status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }, checkIn: { gte: monthStart, lte: todayEnd } },
    }),
    prisma.housekeepingTask.count({ where: { propertyId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    prisma.maintenanceRequest.count({ where: { propertyId, status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.room.groupBy({ by: ['status'], where: { propertyId, isActive: true }, _count: { status: true } }),
  ]);

  const arrivals = await prisma.reservation.findMany({
    where: { propertyId, checkIn: { gte: todayStart, lte: todayEnd }, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
    include: { guest: true, room: true },
    take: 10,
    orderBy: { checkIn: 'asc' },
  });

  const departures = await prisma.reservation.findMany({
    where: { propertyId, checkOut: { gte: todayStart, lte: todayEnd }, status: { in: ['CHECKED_IN', 'CHECKED_OUT'] } },
    include: { guest: true, room: true },
    take: 10,
    orderBy: { checkOut: 'asc' },
  });

  const upcomingReservations = await prisma.reservation.findMany({
    where: { propertyId, checkIn: { gt: todayEnd }, status: { in: ['CONFIRMED', 'PENDING'] } },
    include: { guest: true, room: { include: { roomType: true } } },
    take: 5,
    orderBy: { checkIn: 'asc' },
  });

  const occupancyPercent = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

  const checkedInRevenue = await prisma.reservation.aggregate({
    _sum: { roomRate: true },
    _count: true,
    where: { propertyId, status: 'CHECKED_IN', checkIn: { lte: todayEnd }, checkOut: { gte: todayStart } },
  });

  const averageDailyRate = checkedInRevenue._count > 0
    ? Number(checkedInRevenue._sum.roomRate ?? 0) / checkedInRevenue._count
    : 0;

  const statusCountsMap = Object.fromEntries(
    roomStatusCounts.map(({ status, _count }) => [status.toLowerCase(), _count.status])
  );

  return {
    todayArrivals,
    todayDepartures,
    currentOccupancy: occupiedRooms,
    occupancyPercent: parseFloat(occupancyPercent.toFixed(2)),
    totalRooms,
    revenueToday: Number(revenueToday._sum.totalAmount ?? 0),
    revenueThisMonth: Number(revenueMonth._sum.totalAmount ?? 0),
    pendingHousekeeping,
    openMaintenanceRequests: openMaintenance,
    averageDailyRate,
    revpar: averageDailyRate * (occupancyPercent / 100),
    arrivals,
    departures,
    upcomingReservations,
    roomStatusCounts: statusCountsMap,
  };
}

export async function getOccupancyTrend(propertyId: string, days = 30) {
  const endDate = new Date();
  const startDate = subDays(endDate, days - 1);
  const totalRooms = await prisma.room.count({ where: { propertyId, isActive: true } });

  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  const trend = await Promise.all(
    dateRange.map(async (day) => {
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);

      const [occupied, revenue] = await Promise.all([
        prisma.reservation.count({
          where: { propertyId, status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }, checkIn: { lt: dayEnd }, checkOut: { gt: dayStart } },
        }),
        prisma.reservation.aggregate({
          _sum: { totalAmount: true },
          where: { propertyId, status: { in: ['CHECKED_IN', 'CHECKED_OUT'] }, checkIn: { gte: dayStart, lte: dayEnd } },
        }),
      ]);

      return {
        date: format(day, 'yyyy-MM-dd'),
        occupancy: totalRooms > 0 ? parseFloat(((occupied / totalRooms) * 100).toFixed(2)) : 0,
        revenue: Number(revenue._sum.totalAmount ?? 0),
      };
    })
  );

  return trend;
}

export async function getRevenueByChannel(propertyId: string, days = 7) {
  const startDate = subDays(new Date(), days - 1);

  const reservations = await prisma.reservation.groupBy({
    by: ['source'],
    _sum: { totalAmount: true },
    _count: true,
    where: { propertyId, status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] }, checkIn: { gte: startDate } },
  });

  const channelLabels: Record<string, string> = {
    DIRECT: 'Direto',
    BOOKING_COM: 'Booking.com',
    EXPEDIA: 'Expedia',
    AIRBNB: 'Airbnb',
    HOTEL_WEBSITE: 'Site próprio',
    PHONE: 'Telefone',
    WALK_IN: 'Walk-in',
    OTHER: 'Outros',
  };

  return reservations.map(({ source, _sum, _count }) => ({
    channel: channelLabels[source] ?? source,
    revenue: Number(_sum.totalAmount ?? 0),
    bookings: _count,
  }));
}
