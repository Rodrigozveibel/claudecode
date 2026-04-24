import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { hashPassword } from '../../utils/crypto';
import { Request } from 'express';
import { UserRole } from '@prisma/client';

export async function getStaff(req: Request, propertyId?: string) {
  const { page, limit, skip } = getPagination(req);
  const where: Record<string, unknown> = {};

  if (propertyId) where.propertyId = propertyId;
  if (req.query.role) where.role = req.query.role;
  if (req.query.active !== undefined) where.isActive = req.query.active === 'true';

  const search = req.query.search as string | undefined;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        propertyId: true,
        isActive: true,
        createdAt: true,
        property: { select: { name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getStaffMember(id: string) {
  const staff = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      propertyId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      property: { select: { name: true } },
      _count: {
        select: {
          housekeepingTasks: true,
          maintenanceAssigned: true,
          reservationsCreated: true,
        },
      },
    },
  });

  if (!staff) throw new AppError('Staff member not found', 404);
  return staff;
}

export async function createStaff(data: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  propertyId?: string;
}) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new AppError('Email already in use', 409);

  const hashedPassword = await hashPassword(data.password);

  return prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      propertyId: data.propertyId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      propertyId: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function updateStaff(id: string, data: Partial<{
  name: string;
  email: string;
  role: UserRole;
  propertyId: string;
  isActive: boolean;
}>) {
  const staff = await prisma.user.findUnique({ where: { id } });
  if (!staff) throw new AppError('Staff member not found', 404);

  if (data.email) {
    const existing = await prisma.user.findFirst({ where: { email: data.email, NOT: { id } } });
    if (existing) throw new AppError('Email already in use', 409);
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      propertyId: true,
      isActive: true,
      updatedAt: true,
    },
  });
}

export async function deactivateStaff(id: string) {
  const staff = await prisma.user.findUnique({ where: { id } });
  if (!staff) throw new AppError('Staff member not found', 404);

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: { id: true, name: true, isActive: true },
  });
}

export async function assignRole(id: string, role: UserRole) {
  const staff = await prisma.user.findUnique({ where: { id } });
  if (!staff) throw new AppError('Staff member not found', 404);

  return prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, role: true },
  });
}

export async function getStaffTasks(staffId: string) {
  const [housekeepingTasks, maintenanceTasks] = await Promise.all([
    prisma.housekeepingTask.findMany({
      where: { assignedTo: staffId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      include: { room: { select: { number: true, floor: true } } },
      orderBy: { scheduledDate: 'asc' },
    }),
    prisma.maintenanceRequest.findMany({
      where: { assignedTo: staffId, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      include: { room: { select: { number: true } } },
      orderBy: { priority: 'desc' },
    }),
  ]);

  return { housekeepingTasks, maintenanceTasks };
}
