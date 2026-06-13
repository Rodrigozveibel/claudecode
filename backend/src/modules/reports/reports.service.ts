import { prisma } from '../../config/database';
import { format, eachDayOfInterval } from 'date-fns';
import { differenceInDays } from 'date-fns';

export async function getOccupancyReport(propertyId: string, startDate: Date, endDate: Date) {
  const totalRooms = await prisma.room.count({ where: { propertyId, isActive: true } });

  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT'] },
      checkIn: { lte: endDate },
      checkOut: { gte: startDate },
    },
    select: { checkIn: true, checkOut: true, roomId: true },
  });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const dailyOccupancy = days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const occupied = reservations.filter(
      (r) => r.checkIn < nextDay && r.checkOut > day
    ).length;

    return {
      date: format(day, 'yyyy-MM-dd'),
      occupiedRooms: occupied,
      totalRooms,
      occupancyRate: totalRooms > 0 ? Math.round((occupied / totalRooms) * 10000) / 100 : 0,
    };
  });

  const avgOccupancy =
    dailyOccupancy.reduce((sum, d) => sum + d.occupancyRate, 0) / dailyOccupancy.length;

  return { dailyOccupancy, averageOccupancy: Math.round(avgOccupancy * 100) / 100, totalRooms };
}

export async function getRevenueReport(propertyId: string, startDate: Date, endDate: Date) {
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
      checkIn: { gte: startDate, lte: endDate },
    },
    include: { payments: { where: { status: 'COMPLETED' } } },
  });

  const totalRevenue = reservations.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalCollected = reservations.reduce(
    (sum, r) => sum + r.payments.reduce((s, p) => s + p.amount, 0),
    0
  );

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const dailyRevenue = days.map((day) => {
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);

    const dayReservations = reservations.filter(
      (r) => r.checkIn >= day && r.checkIn < nextDay
    );

    return {
      date: format(day, 'yyyy-MM-dd'),
      revenue: dayReservations.reduce((sum, r) => sum + r.totalAmount, 0),
      bookings: dayReservations.length,
    };
  });

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    outstanding: Math.round((totalRevenue - totalCollected) * 100) / 100,
    totalBookings: reservations.length,
    dailyRevenue,
  };
}

export async function getGuestReport(propertyId: string, startDate: Date, endDate: Date) {
  const guests = await prisma.guest.findMany({
    where: {
      propertyId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      nationality: true,
      totalStays: true,
      totalSpent: true,
      createdAt: true,
    },
  });

  const nationalities = guests.reduce<Record<string, number>>((acc, g) => {
    const nat = g.nationality || 'Unknown';
    acc[nat] = (acc[nat] || 0) + 1;
    return acc;
  }, {});

  const topGuests = [...guests]
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 10);

  return {
    totalNewGuests: guests.length,
    nationalities: Object.entries(nationalities).map(([nationality, count]) => ({
      nationality,
      count,
    })),
    topGuests,
    averageSpend:
      guests.length > 0
        ? Math.round(
            (guests.reduce((sum, g) => sum + g.totalSpent, 0) / guests.length) * 100
          ) / 100
        : 0,
  };
}

export async function getSourceReport(propertyId: string, startDate: Date, endDate: Date) {
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      createdAt: { gte: startDate, lte: endDate },
    },
    select: { source: true, totalAmount: true },
  });

  const sourceStats = reservations.reduce<
    Record<string, { count: number; revenue: number }>
  >((acc, r) => {
    if (!acc[r.source]) acc[r.source] = { count: 0, revenue: 0 };
    acc[r.source].count += 1;
    acc[r.source].revenue += r.totalAmount;
    return acc;
  }, {});

  return Object.entries(sourceStats).map(([source, stats]) => ({
    source,
    bookings: stats.count,
    revenue: Math.round(stats.revenue * 100) / 100,
    percentage:
      reservations.length > 0
        ? Math.round((stats.count / reservations.length) * 10000) / 100
        : 0,
  }));
}
