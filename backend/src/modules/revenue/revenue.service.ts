import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { differenceInDays } from 'date-fns';

export async function getMetrics(propertyId: string, startDate: Date, endDate: Date) {
  const [totalRooms, checkedInReservations, completedReservations] = await Promise.all([
    prisma.room.count({ where: { propertyId, isActive: true } }),
    prisma.reservation.findMany({
      where: {
        propertyId,
        status: 'CHECKED_IN',
        checkIn: { lte: endDate },
        checkOut: { gte: startDate },
      },
    }),
    prisma.reservation.findMany({
      where: {
        propertyId,
        status: { in: ['CHECKED_IN', 'CHECKED_OUT'] },
        checkIn: { gte: startDate, lte: endDate },
      },
    }),
  ]);

  const days = differenceInDays(endDate, startDate) + 1;
  const occupiedRoomNights = checkedInReservations.reduce((sum, r) => {
    const start = r.checkIn > startDate ? r.checkIn : startDate;
    const end = r.checkOut < endDate ? r.checkOut : endDate;
    return sum + Math.max(0, differenceInDays(end, start));
  }, 0);

  const totalRevenue = completedReservations.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalAvailableRoomNights = totalRooms * days;
  const occupancy =
    totalAvailableRoomNights > 0
      ? (occupiedRoomNights / totalAvailableRoomNights) * 100
      : 0;

  const ADR =
    completedReservations.length > 0
      ? completedReservations.reduce((sum, r) => sum + r.roomRate, 0) /
        completedReservations.length
      : 0;

  const RevPAR = totalAvailableRoomNights > 0 ? totalRevenue / totalAvailableRoomNights : 0;

  return {
    occupancyPercent: Math.round(occupancy * 100) / 100,
    ADR: Math.round(ADR * 100) / 100,
    RevPAR: Math.round(RevPAR * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalRooms,
    totalReservations: completedReservations.length,
    period: { startDate, endDate, days },
  };
}

export async function getRateRules(propertyId: string) {
  return prisma.rateRule.findMany({
    where: { propertyId },
    include: {
      roomType: { select: { id: true, name: true, basePrice: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createRateRule(data: {
  propertyId: string;
  roomTypeId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  daysOfWeek?: number[];
  modifier: number;
  modifierType?: string;
  minNights?: number;
}) {
  return prisma.rateRule.create({
    data: {
      propertyId: data.propertyId,
      roomTypeId: data.roomTypeId,
      name: data.name,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      daysOfWeek: data.daysOfWeek || [],
      modifier: data.modifier,
      modifierType: data.modifierType || 'percentage',
      minNights: data.minNights || 1,
    },
    include: { roomType: { select: { id: true, name: true } } },
  });
}

export async function updateRateRule(
  id: string,
  data: {
    name?: string;
    startDate?: string;
    endDate?: string;
    daysOfWeek?: number[];
    modifier?: number;
    modifierType?: string;
    minNights?: number;
    isActive?: boolean;
  }
) {
  const existing = await prisma.rateRule.findUnique({ where: { id } });
  if (!existing) throw new AppError('Rate rule not found', 404);

  return prisma.rateRule.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    },
    include: { roomType: { select: { id: true, name: true } } },
  });
}

export async function deleteRateRule(id: string) {
  const existing = await prisma.rateRule.findUnique({ where: { id } });
  if (!existing) throw new AppError('Rate rule not found', 404);

  return prisma.rateRule.delete({ where: { id } });
}
