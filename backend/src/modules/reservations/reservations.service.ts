import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { generateConfirmationNumber } from '../../utils/crypto';
import { Request } from 'express';
import { differenceInDays } from 'date-fns';
import { ReservationStatus, ReservationSource } from '@prisma/client';

export async function checkAvailability(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  adults: number,
  children = 0
) {
  const roomTypes = await prisma.roomType.findMany({
    where: { propertyId, isActive: true, maxOccupancy: { gte: adults + children } },
    include: {
      rooms: {
        where: {
          isActive: true,
          status: { notIn: ['OUT_OF_ORDER', 'MAINTENANCE'] },
          reservations: {
            none: {
              status: { in: ['CONFIRMED', 'CHECKED_IN'] },
              OR: [{ checkIn: { lt: checkOut }, checkOut: { gt: checkIn } }],
            },
          },
        },
      },
    },
  });

  const nights = differenceInDays(checkOut, checkIn);

  return roomTypes
    .filter((rt) => rt.rooms.length > 0)
    .map((rt) => ({
      roomTypeId: rt.id,
      name: rt.name,
      description: rt.description,
      maxOccupancy: rt.maxOccupancy,
      maxAdults: rt.maxAdults,
      maxChildren: rt.maxChildren,
      basePrice: rt.basePrice,
      totalPrice: rt.basePrice * nights,
      nights,
      availableRooms: rt.rooms.length,
      amenities: rt.amenities,
      photos: rt.photos,
    }));
}

export async function calculatePrice(
  roomTypeId: string,
  checkIn: Date,
  checkOut: Date,
  addons?: Array<{ name: string; quantity: number; unitPrice: number }>
) {
  const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
  if (!roomType) throw new AppError('Room type not found', 404);

  const nights = differenceInDays(checkOut, checkIn);
  if (nights <= 0) throw new AppError('Invalid date range', 400);

  const property = await prisma.property.findUnique({ where: { id: roomType.propertyId } });

  let roomRate = roomType.basePrice;

  const activeRules = await prisma.rateRule.findMany({
    where: {
      roomTypeId,
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: checkOut }, endDate: { gte: checkIn } },
      ],
    },
  });

  for (const rule of activeRules) {
    if (rule.startDate && rule.endDate) {
      roomRate = rule.amount;
    }
  }

  const roomTotal = roomRate * nights;
  const addonsTotal = (addons || []).reduce((sum, a) => sum + a.quantity * a.unitPrice, 0);
  const subtotal = roomTotal + addonsTotal;
  const taxRate = property?.taxRate ?? 0;
  const taxes = subtotal * (taxRate / 100);
  const total = subtotal + taxes;

  return { roomRate, nights, roomTotal, addonsTotal, subtotal, taxes, total, taxRate };
}

export async function createReservation(data: {
  propertyId: string;
  roomId?: string;
  roomTypeId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children?: number;
  source?: ReservationSource;
  channelBookingId?: string;
  specialRequests?: string;
  internalNotes?: string;
  createdBy?: string;
  addons?: Array<{ name: string; quantity: number; unitPrice: number }>;
}) {
  const guest = await prisma.guest.findUnique({ where: { id: data.guestId } });
  if (!guest) throw new AppError('Guest not found', 404);
  if (guest.blacklisted) throw new AppError('Guest is blacklisted', 403);

  const nights = differenceInDays(data.checkOut, data.checkIn);
  if (nights <= 0) throw new AppError('Invalid date range', 400);

  if (data.roomId) {
    const conflict = await prisma.reservation.findFirst({
      where: {
        roomId: data.roomId,
        status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        OR: [{ checkIn: { lt: data.checkOut }, checkOut: { gt: data.checkIn } }],
      },
    });
    if (conflict) throw new AppError('Room is not available for selected dates', 409);
  }

  const priceCalc = await calculatePrice(data.roomTypeId, data.checkIn, data.checkOut, data.addons);

  const confirmationNumber = generateConfirmationNumber();

  const reservation = await prisma.$transaction(async (tx) => {
    const res = await tx.reservation.create({
      data: {
        propertyId: data.propertyId,
        roomId: data.roomId,
        roomTypeId: data.roomTypeId,
        guestId: data.guestId,
        confirmationNumber,
        status: 'CONFIRMED',
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        adults: data.adults,
        children: data.children ?? 0,
        nightsCount: nights,
        roomRate: priceCalc.roomRate,
        totalAmount: priceCalc.total,
        paidAmount: 0,
        source: data.source ?? 'DIRECT',
        channelBookingId: data.channelBookingId,
        specialRequests: data.specialRequests,
        internalNotes: data.internalNotes,
        createdBy: data.createdBy,
      },
      include: {
        guest: { select: { firstName: true, lastName: true, email: true } },
        room: { select: { number: true } },
        roomType: { select: { name: true } },
      },
    });

    if (data.addons && data.addons.length > 0) {
      await tx.reservationAddon.createMany({
        data: data.addons.map((a) => ({
          reservationId: res.id,
          name: a.name,
          quantity: a.quantity,
          unitPrice: a.unitPrice,
          total: a.quantity * a.unitPrice,
        })),
      });
    }

    return res;
  });

  return reservation;
}

export async function getReservations(req: Request, propertyId?: string) {
  const { page, limit, skip } = getPagination(req);
  const where: Record<string, unknown> = {};

  if (propertyId) where.propertyId = propertyId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.source) where.source = req.query.source;
  if (req.query.guestId) where.guestId = req.query.guestId;
  if (req.query.roomId) where.roomId = req.query.roomId;

  if (req.query.checkInFrom || req.query.checkInTo) {
    where.checkIn = {
      ...(req.query.checkInFrom ? { gte: new Date(req.query.checkInFrom as string) } : {}),
      ...(req.query.checkInTo ? { lte: new Date(req.query.checkInTo as string) } : {}),
    };
  }

  if (req.query.search) {
    const search = req.query.search as string;
    where.OR = [
      { confirmationNumber: { contains: search, mode: 'insensitive' } },
      { guest: { firstName: { contains: search, mode: 'insensitive' } } },
      { guest: { lastName: { contains: search, mode: 'insensitive' } } },
      { guest: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { checkIn: 'desc' },
      include: {
        guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
        room: { select: { number: true, floor: true } },
        roomType: { select: { name: true } },
      },
    }),
    prisma.reservation.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getReservationById(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      roomType: true,
      addons: true,
      payments: true,
      invoices: { include: { items: true } },
    },
  });
  if (!reservation) throw new AppError('Reservation not found', 404);
  return reservation;
}

export async function getReservationByConfirmation(confirmationNumber: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { confirmationNumber },
    include: {
      guest: { select: { firstName: true, lastName: true, email: true } },
      room: { select: { number: true } },
      roomType: { select: { name: true } },
    },
  });
  if (!reservation) throw new AppError('Reservation not found', 404);
  return reservation;
}

export async function updateReservation(id: string, data: Partial<{
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  adults: number;
  children: number;
  specialRequests: string;
  internalNotes: string;
  status: ReservationStatus;
}>) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw new AppError('Reservation not found', 404);

  if (['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'].includes(reservation.status)) {
    throw new AppError('Cannot modify a completed reservation', 400);
  }

  let updateData: Record<string, unknown> = { ...data };

  if (data.checkIn || data.checkOut) {
    const checkIn = data.checkIn ?? reservation.checkIn;
    const checkOut = data.checkOut ?? reservation.checkOut;
    const nights = differenceInDays(checkOut, checkIn);
    updateData.nightsCount = nights;
    updateData.totalAmount = reservation.roomRate * nights;
  }

  return prisma.reservation.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.reservation.update>[0]['data'],
    include: {
      guest: { select: { firstName: true, lastName: true } },
      room: { select: { number: true } },
      roomType: { select: { name: true } },
    },
  });
}

export async function cancelReservation(id: string, reason?: string) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw new AppError('Reservation not found', 404);

  if (['CHECKED_IN', 'CHECKED_OUT'].includes(reservation.status)) {
    throw new AppError('Cannot cancel an active or completed reservation', 400);
  }

  return prisma.reservation.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      internalNotes: reason
        ? `${reservation.internalNotes ?? ''}\nCancelled: ${reason}`.trim()
        : reservation.internalNotes,
    },
  });
}
