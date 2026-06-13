import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export interface CreateGuestData {
  propertyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  documentType?: string;
  documentNumber?: string;
  nationality?: string;
  birthDate?: string;
  address?: string;
  city?: string;
  country?: string;
  preferences?: object;
  notes?: string;
}

export async function getAll(
  propertyId: string,
  page = 1,
  limit = 20,
  search?: string
) {
  const skip = (page - 1) * limit;
  const where: Record<string, unknown> = { propertyId };

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [guests, total] = await Promise.all([
    prisma.guest.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        nationality: true,
        totalStays: true,
        totalSpent: true,
        loyaltyPoints: true,
        blacklisted: true,
        createdAt: true,
      },
    }),
    prisma.guest.count({ where }),
  ]);

  return { guests, total, page, limit };
}

export async function getById(id: string) {
  const guest = await prisma.guest.findUnique({
    where: { id },
    include: {
      reservations: {
        include: {
          room: { select: { number: true } },
          roomType: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });
  if (!guest) throw new AppError('Guest not found', 404);
  return guest;
}

export async function create(data: CreateGuestData) {
  const existing = await prisma.guest.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already registered', 409);

  return prisma.guest.create({
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      preferences: data.preferences || {},
    },
  });
}

export async function update(id: string, data: Partial<CreateGuestData>) {
  const existing = await prisma.guest.findUnique({ where: { id } });
  if (!existing) throw new AppError('Guest not found', 404);

  if (data.email && data.email !== existing.email) {
    const emailTaken = await prisma.guest.findUnique({ where: { email: data.email } });
    if (emailTaken) throw new AppError('Email already in use', 409);
  }

  return prisma.guest.update({
    where: { id },
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
    },
  });
}

export async function search(query: string, propertyId: string) {
  return prisma.guest.findMany({
    where: {
      propertyId,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } },
      ],
    },
    take: 10,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      totalStays: true,
      loyaltyPoints: true,
    },
  });
}

export async function getHistory(guestId: string) {
  const guest = await prisma.guest.findUnique({ where: { id: guestId } });
  if (!guest) throw new AppError('Guest not found', 404);

  const reservations = await prisma.reservation.findMany({
    where: { guestId },
    include: {
      room: { select: { number: true, floor: true } },
      roomType: { select: { name: true } },
      payments: true,
      addons: true,
    },
    orderBy: { checkIn: 'desc' },
  });

  return { guest, reservations };
}
