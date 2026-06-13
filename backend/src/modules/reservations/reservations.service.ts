import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { generateConfirmationNumber } from '../../utils/crypto';
import { ReservationStatus, ReservationSource } from '@prisma/client';
import { differenceInDays } from 'date-fns';

export interface CreateReservationData {
  propertyId: string;
  roomId: string;
  roomTypeId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  adults?: number;
  children?: number;
  source?: ReservationSource;
  specialRequests?: string;
  internalNotes?: string;
  createdBy?: string;
  addons?: Array<{ name: string; quantity: number; unitPrice: number }>;
}

export async function checkAvailability(
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  adults: number,
  children = 0
) {
  const nights = differenceInDays(checkOut, checkIn);
  if (nights < 1) throw new AppError('Check-out must be after check-in', 400);

  const roomTypes = await prisma.roomType.findMany({
    where: {
      propertyId,
      isActive: true,
      maxAdults: { gte: adults },
      maxOccupancy: { gte: adults + children },
    },
    include: {
      rooms: {
        where: { isActive: true, status: { not: 'OUT_OF_ORDER' } },
        select: { id: true, number: true, floor: true, status: true },
      },
    },
  });

  const busyRoomIds = await prisma.reservation.findMany({
    where: {
      propertyId,
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      OR: [
        { checkIn: { gte: checkIn, lt: checkOut } },
        { checkOut: { gt: checkIn, lte: checkOut } },
        { checkIn: { lte: checkIn }, checkOut: { gte: checkOut } },
      ],
    },
    select: { roomId: true },
  });

  const busyIds = new Set(busyRoomIds.map((r) => r.roomId));

  return roomTypes.map((rt) => {
    const availableRooms = rt.rooms.filter((r) => !busyIds.has(r.id));
    return {
      roomTypeId: rt.id,
      name: rt.name,
      description: rt.description,
      maxOccupancy: rt.maxOccupancy,
      maxAdults: rt.maxAdults,
      maxChildren: rt.maxChildren,
      basePrice: rt.basePrice,
      totalPrice: rt.basePrice * nights,
      nights,
      amenities: rt.amenities,
      photos: rt.photos,
      availableRooms,
      availableCount: availableRooms.length,
    };
  });
}

export async function calculatePrice(roomTypeId: string, checkIn: Date, checkOut: Date) {
  const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
  if (!roomType) throw new AppError('Room type not found', 404);

  const nights = differenceInDays(checkOut, checkIn);
  if (nights < 1) throw new AppError('Invalid dates', 400);

  const baseTotal = roomType.basePrice * nights;

  return {
    roomTypeId,
    roomTypeName: roomType.name,
    basePrice: roomType.basePrice,
    nights,
    baseTotal,
    taxes: baseTotal * 0.1,
    total: baseTotal + baseTotal * 0.1,
  };
}

export async function getAll(
  propertyId: string,
  filters: {
    status?: ReservationStatus;
    page?: number;
    limit?: number;
    guestId?: string;
    checkIn?: string;
    checkOut?: string;
  }
) {
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { propertyId };
  if (filters.status) where.status = filters.status;
  if (filters.guestId) where.guestId = filters.guestId;
  if (filters.checkIn) where.checkIn = { gte: new Date(filters.checkIn) };
  if (filters.checkOut) where.checkOut = { lte: new Date(filters.checkOut) };

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      skip,
      take: limit,
      include: {
        guest: { select: { id: true, firstName: true, lastName: true, email: true } },
        room: { select: { id: true, number: true, floor: true } },
        roomType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.reservation.count({ where }),
  ]);

  return { reservations, total, page, limit };
}

export async function getById(id: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      guest: true,
      room: { include: { roomType: true } },
      roomType: true,
      addons: true,
      payments: true,
      invoice: { include: { items: true } },
    },
  });
  if (!reservation) throw new AppError('Reservation not found', 404);
  return reservation;
}

export async function create(data: CreateReservationData) {
  const checkIn = new Date(data.checkIn);
  const checkOut = new Date(data.checkOut);
  const nights = differenceInDays(checkOut, checkIn);

  if (nights < 1) throw new AppError('Check-out must be after check-in', 400);

  const room = await prisma.room.findUnique({
    where: { id: data.roomId },
    include: { roomType: true },
  });
  if (!room || !room.isActive) throw new AppError('Room not found or unavailable', 400);

  const conflict = await prisma.reservation.findFirst({
    where: {
      roomId: data.roomId,
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'PENDING'] },
      OR: [
        { checkIn: { gte: checkIn, lt: checkOut } },
        { checkOut: { gt: checkIn, lte: checkOut } },
        { checkIn: { lte: checkIn }, checkOut: { gte: checkOut } },
      ],
    },
  });

  if (conflict) throw new AppError('Room is not available for selected dates', 409);

  const roomRate = room.roomType.basePrice;
  const addonsTotal = (data.addons || []).reduce(
    (sum, a) => sum + a.quantity * a.unitPrice,
    0
  );
  const totalAmount = roomRate * nights + addonsTotal;

  const reservation = await prisma.reservation.create({
    data: {
      propertyId: data.propertyId,
      roomId: data.roomId,
      roomTypeId: data.roomTypeId,
      guestId: data.guestId,
      confirmationNumber: generateConfirmationNumber(),
      status: 'CONFIRMED',
      checkIn,
      checkOut,
      adults: data.adults || 1,
      children: data.children || 0,
      nightsCount: nights,
      roomRate,
      totalAmount,
      source: data.source || 'DIRECT',
      specialRequests: data.specialRequests,
      internalNotes: data.internalNotes,
      createdBy: data.createdBy,
      addons: data.addons
        ? {
            create: data.addons.map((a) => ({
              name: a.name,
              quantity: a.quantity,
              unitPrice: a.unitPrice,
              total: a.quantity * a.unitPrice,
            })),
          }
        : undefined,
    },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true, email: true } },
      room: { select: { id: true, number: true } },
      roomType: { select: { id: true, name: true } },
      addons: true,
    },
  });

  return reservation;
}

export async function update(id: string, data: Partial<CreateReservationData>) {
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) throw new AppError('Reservation not found', 404);

  if (existing.status === 'CANCELLED' || existing.status === 'CHECKED_OUT') {
    throw new AppError('Cannot update a cancelled or checked-out reservation', 400);
  }

  const updateData: Record<string, unknown> = {};
  if (data.specialRequests !== undefined) updateData.specialRequests = data.specialRequests;
  if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;
  if (data.adults !== undefined) updateData.adults = data.adults;
  if (data.children !== undefined) updateData.children = data.children;

  return prisma.reservation.update({
    where: { id },
    data: updateData,
    include: {
      guest: { select: { id: true, firstName: true, lastName: true } },
      room: { select: { id: true, number: true } },
    },
  });
}

export async function cancel(id: string, reason?: string) {
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) throw new AppError('Reservation not found', 404);

  if (reservation.status === 'CHECKED_IN') {
    throw new AppError('Cannot cancel a checked-in reservation', 400);
  }
  if (reservation.status === 'CANCELLED') {
    throw new AppError('Reservation is already cancelled', 400);
  }

  return prisma.reservation.update({
    where: { id },
    data: {
      status: 'CANCELLED',
      internalNotes: reason
        ? `Cancelled: ${reason}\n${reservation.internalNotes || ''}`
        : reservation.internalNotes,
    },
  });
}

export async function getTodayArrivals(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.reservation.findMany({
    where: {
      propertyId,
      checkIn: { gte: today, lt: tomorrow },
      status: { in: ['CONFIRMED', 'CHECKED_IN'] },
    },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      room: { select: { id: true, number: true, floor: true } },
      roomType: { select: { name: true } },
    },
    orderBy: { checkIn: 'asc' },
  });
}

export async function getTodayDepartures(propertyId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.reservation.findMany({
    where: {
      propertyId,
      checkOut: { gte: today, lt: tomorrow },
      status: 'CHECKED_IN',
    },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      room: { select: { id: true, number: true, floor: true } },
      roomType: { select: { name: true } },
    },
    orderBy: { checkOut: 'asc' },
  });
}
