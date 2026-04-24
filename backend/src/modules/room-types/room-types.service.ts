import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { Request } from 'express';
import { addDays, eachDayOfInterval, format } from 'date-fns';

export async function createRoomType(data: {
  propertyId: string;
  name: string;
  description?: string;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren?: number;
  size?: number;
  amenities?: unknown;
  photos?: unknown;
  basePrice: number;
}) {
  return prisma.roomType.create({ data: data as Parameters<typeof prisma.roomType.create>[0]['data'] });
}

export async function getRoomTypes(req: Request, propertyId?: string) {
  const { page, limit, skip } = getPagination(req);
  const where: Record<string, unknown> = {};

  if (propertyId) where.propertyId = propertyId;
  if (req.query.active === 'true') where.isActive = true;

  const [items, total] = await Promise.all([
    prisma.roomType.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      include: { _count: { select: { rooms: true } } },
    }),
    prisma.roomType.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getRoomTypeById(id: string) {
  const roomType = await prisma.roomType.findUnique({
    where: { id },
    include: { _count: { select: { rooms: true, reservations: true } } },
  });
  if (!roomType) throw new AppError('Room type not found', 404);
  return roomType;
}

export async function updateRoomType(id: string, data: Partial<{
  name: string;
  description: string;
  maxOccupancy: number;
  maxAdults: number;
  maxChildren: number;
  size: number;
  amenities: unknown;
  photos: unknown;
  basePrice: number;
  isActive: boolean;
}>) {
  const roomType = await prisma.roomType.findUnique({ where: { id } });
  if (!roomType) throw new AppError('Room type not found', 404);

  return prisma.roomType.update({ where: { id }, data: data as Parameters<typeof prisma.roomType.update>[0]['data'] });
}

export async function deleteRoomType(id: string) {
  const roomType = await prisma.roomType.findUnique({ where: { id } });
  if (!roomType) throw new AppError('Room type not found', 404);

  const rooms = await prisma.room.count({ where: { roomTypeId: id } });
  if (rooms > 0) throw new AppError('Cannot delete room type with existing rooms', 400);

  return prisma.roomType.update({ where: { id }, data: { isActive: false } });
}

export async function getPricingCalendar(roomTypeId: string, startDate: Date, endDate: Date) {
  const roomType = await prisma.roomType.findUnique({ where: { id: roomTypeId } });
  if (!roomType) throw new AppError('Room type not found', 404);

  const rateRules = await prisma.rateRule.findMany({
    where: {
      roomTypeId,
      isActive: true,
      OR: [
        { startDate: null },
        { startDate: { lte: endDate } },
      ],
    },
    orderBy: { rateType: 'asc' },
  });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const calendar = days.map((day) => {
    const dayOfWeek = day.getDay();
    let price = roomType.basePrice;

    for (const rule of rateRules) {
      if (rule.startDate && rule.endDate) {
        if (day >= rule.startDate && day <= rule.endDate) {
          price = rule.amount;
        }
      } else if (rule.daysOfWeek) {
        const daysArray = rule.daysOfWeek as number[];
        if (daysArray.includes(dayOfWeek)) {
          price = rule.amount;
        }
      }
    }

    return {
      date: format(day, 'yyyy-MM-dd'),
      price,
      basePrice: roomType.basePrice,
    };
  });

  return calendar;
}
