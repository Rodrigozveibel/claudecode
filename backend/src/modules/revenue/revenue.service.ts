import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { eachDayOfInterval, format, differenceInDays } from 'date-fns';
import { RateType } from '@prisma/client';

export async function getOccupancyMetrics(propertyId: string, startDate: Date, endDate: Date) {
  const totalRooms = await prisma.room.count({ where: { propertyId, isActive: true } });

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const results = [];

  for (const day of days) {
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);

    const occupiedCount = await prisma.reservation.count({
      where: {
        propertyId,
        status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { lt: nextDay },
        checkOut: { gt: day },
      },
    });

    const occupancyRate = totalRooms > 0 ? (occupiedCount / totalRooms) * 100 : 0;

    results.push({
      date: format(day, 'yyyy-MM-dd'),
      occupiedRooms: occupiedCount,
      totalRooms,
      occupancyRate: parseFloat(occupancyRate.toFixed(2)),
    });
  }

  const avgOccupancy =
    results.reduce((sum, r) => sum + r.occupancyRate, 0) / results.length;

  return { daily: results, avgOccupancy: parseFloat(avgOccupancy.toFixed(2)) };
}

export async function getRevenueMetrics(propertyId: string, startDate: Date, endDate: Date) {
  const reservations = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: { in: ['CHECKED_IN', 'CHECKED_OUT', 'CONFIRMED'] },
      checkIn: { gte: startDate, lte: endDate },
    },
    select: { checkIn: true, totalAmount: true, roomRate: true, nightsCount: true },
  });

  const dailyRevenue: Record<string, number> = {};
  for (const res of reservations) {
    const key = format(res.checkIn, 'yyyy-MM-dd');
    dailyRevenue[key] = (dailyRevenue[key] || 0) + res.totalAmount;
  }

  const totalRevenue = reservations.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalRooms = await prisma.room.count({ where: { propertyId, isActive: true } });
  const nights = differenceInDays(endDate, startDate) + 1;

  const adr = reservations.length > 0
    ? totalRevenue / reservations.length
    : 0;

  const revpar = totalRooms > 0 && nights > 0
    ? totalRevenue / (totalRooms * nights)
    : 0;

  return {
    totalRevenue,
    adr: parseFloat(adr.toFixed(2)),
    revpar: parseFloat(revpar.toFixed(2)),
    totalReservations: reservations.length,
    dailyRevenue,
  };
}

export async function getADR(propertyId: string, startDate: Date, endDate: Date) {
  const result = await prisma.reservation.aggregate({
    where: {
      propertyId,
      status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
      checkIn: { gte: startDate, lte: endDate },
    },
    _avg: { roomRate: true },
    _count: true,
    _sum: { totalAmount: true },
  });

  return {
    adr: parseFloat((result._avg.roomRate ?? 0).toFixed(2)),
    totalReservations: result._count,
    totalRevenue: result._sum.totalAmount ?? 0,
  };
}

export async function getRevPAR(propertyId: string, startDate: Date, endDate: Date) {
  const totalRooms = await prisma.room.count({ where: { propertyId, isActive: true } });
  const nights = differenceInDays(endDate, startDate) + 1;

  const revenue = await prisma.reservation.aggregate({
    where: {
      propertyId,
      status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
      checkIn: { gte: startDate, lte: endDate },
    },
    _sum: { totalAmount: true },
  });

  const totalRevenue = revenue._sum.totalAmount ?? 0;
  const revpar = totalRooms > 0 && nights > 0 ? totalRevenue / (totalRooms * nights) : 0;

  return {
    revpar: parseFloat(revpar.toFixed(2)),
    totalRevenue,
    totalRooms,
    nights,
  };
}

export async function createRateRule(data: {
  propertyId: string;
  roomTypeId?: string;
  name: string;
  rateType: RateType;
  amount: number;
  minNights?: number;
  startDate?: Date;
  endDate?: Date;
  daysOfWeek?: number[];
}) {
  return prisma.rateRule.create({ data: data as Parameters<typeof prisma.rateRule.create>[0]['data'] });
}

export async function getRateRules(propertyId: string) {
  return prisma.rateRule.findMany({
    where: { propertyId },
    include: { roomType: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateRateRule(id: string, data: Partial<{
  name: string;
  amount: number;
  minNights: number;
  startDate: Date;
  endDate: Date;
  daysOfWeek: number[];
  isActive: boolean;
}>) {
  const rule = await prisma.rateRule.findUnique({ where: { id } });
  if (!rule) throw new AppError('Rate rule not found', 404);

  return prisma.rateRule.update({ where: { id }, data: data as Parameters<typeof prisma.rateRule.update>[0]['data'] });
}

export async function deleteRateRule(id: string) {
  const rule = await prisma.rateRule.findUnique({ where: { id } });
  if (!rule) throw new AppError('Rate rule not found', 404);

  return prisma.rateRule.delete({ where: { id } });
}

export async function getRatesForDateRange(propertyId: string, startDate: Date, endDate: Date) {
  const roomTypes = await prisma.roomType.findMany({
    where: { propertyId, isActive: true },
    include: {
      rateRules: {
        where: {
          isActive: true,
          OR: [
            { startDate: null },
            { startDate: { lte: endDate }, endDate: { gte: startDate } },
          ],
        },
      },
    },
  });

  return roomTypes.map((rt) => ({
    roomTypeId: rt.id,
    name: rt.name,
    basePrice: rt.basePrice,
    rateRules: rt.rateRules,
  }));
}

export async function getYieldSuggestions(propertyId: string) {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const totalRooms = await prisma.room.count({ where: { propertyId, isActive: true } });

  const upcomingReservations = await prisma.reservation.count({
    where: {
      propertyId,
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
      checkIn: { gte: today, lte: nextWeek },
    },
  });

  const occupancyRate = totalRooms > 0 ? (upcomingReservations / totalRooms) * 100 : 0;

  const suggestions = [];

  if (occupancyRate > 80) {
    suggestions.push({
      type: 'INCREASE_RATES',
      message: `High demand detected (${occupancyRate.toFixed(1)}% occupancy next week). Consider increasing rates by 10-20%.`,
      priority: 'HIGH',
    });
  } else if (occupancyRate < 30) {
    suggestions.push({
      type: 'DECREASE_RATES',
      message: `Low demand detected (${occupancyRate.toFixed(1)}% occupancy next week). Consider promotions or last-minute deals.`,
      priority: 'MEDIUM',
    });
  } else {
    suggestions.push({
      type: 'MAINTAIN_RATES',
      message: `Normal occupancy (${occupancyRate.toFixed(1)}%). Current rates appear competitive.`,
      priority: 'LOW',
    });
  }

  return {
    occupancyRate: parseFloat(occupancyRate.toFixed(2)),
    totalRooms,
    bookedRooms: upcomingReservations,
    suggestions,
  };
}
