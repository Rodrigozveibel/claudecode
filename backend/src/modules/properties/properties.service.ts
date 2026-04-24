import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { Request } from 'express';

export async function createProperty(data: {
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  zipCode?: string;
  phone: string;
  email: string;
  website?: string;
  currency?: string;
  timezone?: string;
  checkInTime?: string;
  checkOutTime?: string;
  policies?: string;
  amenities?: unknown;
  starRating?: number;
  taxRate?: number;
}) {
  const existing = await prisma.property.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError('Property slug already in use', 409);

  return prisma.property.create({ data: data as Parameters<typeof prisma.property.create>[0]['data'] });
}

export async function getProperties(req: Request) {
  const { page, limit, skip } = getPagination(req);
  const search = req.query.search as string | undefined;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { city: { contains: search, mode: 'insensitive' as const } },
          { country: { contains: search, mode: 'insensitive' as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
    }),
    prisma.property.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getPropertyById(id: string) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new AppError('Property not found', 404);
  return property;
}

export async function getPropertyBySlug(slug: string) {
  const property = await prisma.property.findUnique({ where: { slug } });
  if (!property) throw new AppError('Property not found', 404);
  return property;
}

export async function updateProperty(id: string, data: Partial<{
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  email: string;
  website: string;
  currency: string;
  timezone: string;
  checkInTime: string;
  checkOutTime: string;
  policies: string;
  amenities: unknown;
  starRating: number;
  taxRate: number;
  isActive: boolean;
}>) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new AppError('Property not found', 404);

  return prisma.property.update({ where: { id }, data: data as Parameters<typeof prisma.property.update>[0]['data'] });
}

export async function deleteProperty(id: string) {
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) throw new AppError('Property not found', 404);

  return prisma.property.update({ where: { id }, data: { isActive: false } });
}

export async function getPropertySettings(id: string) {
  const property = await prisma.property.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      currency: true,
      timezone: true,
      checkInTime: true,
      checkOutTime: true,
      policies: true,
      amenities: true,
      taxRate: true,
    },
  });
  if (!property) throw new AppError('Property not found', 404);
  return property;
}

export async function updatePropertySettings(id: string, data: {
  currency?: string;
  timezone?: string;
  checkInTime?: string;
  checkOutTime?: string;
  policies?: string;
  amenities?: unknown;
  taxRate?: number;
}) {
  return prisma.property.update({
    where: { id },
    data: data as Parameters<typeof prisma.property.update>[0]['data'],
    select: {
      id: true,
      currency: true,
      timezone: true,
      checkInTime: true,
      checkOutTime: true,
      policies: true,
      amenities: true,
      taxRate: true,
    },
  });
}
