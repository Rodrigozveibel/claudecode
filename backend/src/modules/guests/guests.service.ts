import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { Request } from 'express';

export async function createGuest(data: {
  propertyId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  document?: string;
  documentType?: string;
  nationality?: string;
  birthDate?: Date;
  address?: string;
  city?: string;
  country?: string;
  preferences?: unknown;
  notes?: string;
}) {
  return prisma.guest.create({ data: data as Parameters<typeof prisma.guest.create>[0]['data'] });
}

export async function getGuests(req: Request, propertyId?: string) {
  const { page, limit, skip } = getPagination(req);
  const search = req.query.search as string | undefined;
  const where: Record<string, unknown> = {};

  if (propertyId) where.propertyId = propertyId;
  if (req.query.blacklisted !== undefined) where.blacklisted = req.query.blacklisted === 'true';

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
      { document: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.guest.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    }),
    prisma.guest.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getGuestById(id: string) {
  const guest = await prisma.guest.findUnique({
    where: { id },
    include: {
      _count: { select: { reservations: true } },
    },
  });
  if (!guest) throw new AppError('Guest not found', 404);
  return guest;
}

export async function updateGuest(id: string, data: Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  document: string;
  documentType: string;
  nationality: string;
  birthDate: Date;
  address: string;
  city: string;
  country: string;
  preferences: unknown;
  notes: string;
}>) {
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw new AppError('Guest not found', 404);

  return prisma.guest.update({ where: { id }, data: data as Parameters<typeof prisma.guest.update>[0]['data'] });
}

export async function deleteGuest(id: string) {
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw new AppError('Guest not found', 404);

  return prisma.guest.delete({ where: { id } });
}

export async function blacklistGuest(id: string) {
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw new AppError('Guest not found', 404);

  return prisma.guest.update({ where: { id }, data: { blacklisted: true } });
}

export async function unblacklistGuest(id: string) {
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw new AppError('Guest not found', 404);

  return prisma.guest.update({ where: { id }, data: { blacklisted: false } });
}

export async function getGuestHistory(id: string, req: Request) {
  const { page, limit, skip } = getPagination(req);
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw new AppError('Guest not found', 404);

  const [items, total] = await Promise.all([
    prisma.reservation.findMany({
      where: { guestId: id },
      skip,
      take: limit,
      orderBy: { checkIn: 'desc' },
      include: {
        room: { select: { number: true, floor: true } },
        roomType: { select: { name: true } },
        invoices: { select: { id: true, status: true, total: true } },
      },
    }),
    prisma.reservation.count({ where: { guestId: id } }),
  ]);

  return { items, total, page, limit };
}

export async function getLoyaltyHistory(id: string, req: Request) {
  const { page, limit, skip } = getPagination(req);
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) throw new AppError('Guest not found', 404);

  const [items, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { guestId: id },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.loyaltyTransaction.count({ where: { guestId: id } }),
  ]);

  return { items, total, page, limit };
}

export async function mergeDuplicates(primaryId: string, duplicateIds: string[]) {
  const primary = await prisma.guest.findUnique({ where: { id: primaryId } });
  if (!primary) throw new AppError('Primary guest not found', 404);

  await prisma.$transaction(async (tx) => {
    for (const dupId of duplicateIds) {
      await tx.reservation.updateMany({ where: { guestId: dupId }, data: { guestId: primaryId } });
      await tx.payment.updateMany({ where: { guestId: dupId }, data: { guestId: primaryId } });
      await tx.invoice.updateMany({ where: { guestId: dupId }, data: { guestId: primaryId } });
      await tx.guestMessage.updateMany({ where: { guestId: dupId }, data: { guestId: primaryId } });
      await tx.loyaltyTransaction.updateMany({ where: { guestId: dupId }, data: { guestId: primaryId } });
      await tx.guest.delete({ where: { id: dupId } });
    }

    const stats = await tx.reservation.aggregate({
      where: { guestId: primaryId, status: 'CHECKED_OUT' },
      _count: true,
      _sum: { totalAmount: true },
    });

    await tx.guest.update({
      where: { id: primaryId },
      data: {
        totalStays: stats._count,
        totalSpent: stats._sum.totalAmount ?? 0,
      },
    });
  });

  return prisma.guest.findUnique({ where: { id: primaryId } });
}
