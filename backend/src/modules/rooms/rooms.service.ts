import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { Request } from 'express';
import { RoomStatus } from '@prisma/client';

export async function createRoom(data: {
  propertyId: string;
  roomTypeId: string;
  number: string;
  floor?: number;
  notes?: string;
}) {
  return prisma.room.create({
    data,
    include: { roomType: { select: { name: true, basePrice: true } } },
  });
}

export async function getRooms(req: Request, propertyId?: string) {
  const { page, limit, skip } = getPagination(req);
  const where: Record<string, unknown> = {};

  if (propertyId) where.propertyId = propertyId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.floor) where.floor = parseInt(req.query.floor as string);
  if (req.query.roomTypeId) where.roomTypeId = req.query.roomTypeId;
  if (req.query.active === 'true') where.isActive = true;

  const [items, total] = await Promise.all([
    prisma.room.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ floor: 'asc' }, { number: 'asc' }],
      include: {
        roomType: { select: { name: true, basePrice: true, maxOccupancy: true } },
      },
    }),
    prisma.room.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getRoomById(id: string) {
  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      roomType: true,
      housekeepingTasks: {
        where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
        orderBy: { scheduledDate: 'asc' },
        take: 5,
      },
      maintenanceRequests: {
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
        take: 5,
      },
    },
  });
  if (!room) throw new AppError('Room not found', 404);
  return room;
}

export async function updateRoom(id: string, data: Partial<{
  roomTypeId: string;
  number: string;
  floor: number;
  status: RoomStatus;
  isActive: boolean;
  notes: string;
}>) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new AppError('Room not found', 404);

  return prisma.room.update({
    where: { id },
    data,
    include: { roomType: { select: { name: true } } },
  });
}

export async function updateRoomStatus(id: string, status: RoomStatus) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new AppError('Room not found', 404);

  return prisma.room.update({ where: { id }, data: { status } });
}

export async function deleteRoom(id: string) {
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) throw new AppError('Room not found', 404);

  return prisma.room.update({ where: { id }, data: { isActive: false } });
}

export async function getRoomAvailability(propertyId: string, checkIn: Date, checkOut: Date) {
  const rooms = await prisma.room.findMany({
    where: { propertyId, isActive: true, status: { notIn: ['OUT_OF_ORDER', 'MAINTENANCE'] } },
    include: {
      roomType: { select: { name: true, basePrice: true, maxOccupancy: true, maxAdults: true } },
      reservations: {
        where: {
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
          OR: [
            { checkIn: { lte: checkOut }, checkOut: { gte: checkIn } },
          ],
        },
        select: { id: true, checkIn: true, checkOut: true },
      },
    },
  });

  return rooms.map((room) => ({
    ...room,
    isAvailable: room.reservations.length === 0,
  }));
}

export async function bulkUpdateStatus(roomIds: string[], status: RoomStatus) {
  return prisma.room.updateMany({
    where: { id: { in: roomIds } },
    data: { status },
  });
}
