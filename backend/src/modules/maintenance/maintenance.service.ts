import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { Request } from 'express';
import { MaintenanceStatus, Priority } from '@prisma/client';

export async function createMaintenanceRequest(data: {
  propertyId: string;
  roomId?: string;
  reportedBy?: string;
  title: string;
  description: string;
  category: string;
  priority?: Priority;
}) {
  return prisma.maintenanceRequest.create({
    data: {
      ...data,
      status: 'OPEN',
      priority: data.priority ?? 'MEDIUM',
    },
    include: {
      room: { select: { number: true, floor: true } },
      reporter: { select: { name: true } },
    },
  });
}

export async function getMaintenanceRequests(req: Request, propertyId?: string) {
  const { page, limit, skip } = getPagination(req);
  const where: Record<string, unknown> = {};

  if (propertyId) where.propertyId = propertyId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.priority) where.priority = req.query.priority;
  if (req.query.assignedTo) where.assignedTo = req.query.assignedTo;
  if (req.query.roomId) where.roomId = req.query.roomId;
  if (req.query.category) where.category = req.query.category;

  const [items, total] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      include: {
        room: { select: { number: true, floor: true } },
        reporter: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.maintenanceRequest.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function getMaintenanceRequestById(id: string) {
  const request = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      room: true,
      reporter: { select: { name: true, email: true } },
      assignee: { select: { name: true, email: true } },
    },
  });
  if (!request) throw new AppError('Maintenance request not found', 404);
  return request;
}

export async function updateMaintenanceRequest(id: string, data: Partial<{
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: MaintenanceStatus;
  assignedTo: string;
  resolution: string;
}>) {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Maintenance request not found', 404);

  const updateData: Record<string, unknown> = { ...data };

  if (data.status === 'RESOLVED') {
    updateData.resolvedAt = new Date();
  }

  if (data.status === 'IN_PROGRESS' && request.status === 'OPEN') {
    if (request.roomId) {
      await prisma.room.update({
        where: { id: request.roomId },
        data: { status: 'MAINTENANCE' },
      });
    }
  }

  if (data.status === 'RESOLVED' || data.status === 'CLOSED') {
    if (request.roomId) {
      await prisma.room.update({
        where: { id: request.roomId },
        data: { status: 'AVAILABLE' },
      });
    }
  }

  return prisma.maintenanceRequest.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.maintenanceRequest.update>[0]['data'],
    include: {
      room: { select: { number: true } },
      assignee: { select: { name: true } },
    },
  });
}

export async function assignMaintenanceRequest(id: string, assignedTo: string) {
  const request = await prisma.maintenanceRequest.findUnique({ where: { id } });
  if (!request) throw new AppError('Maintenance request not found', 404);

  return prisma.maintenanceRequest.update({
    where: { id },
    data: { assignedTo, status: 'IN_PROGRESS' },
    include: { assignee: { select: { name: true } } },
  });
}

export async function getMaintenanceHistoryByRoom(roomId: string, req: Request) {
  const { page, limit, skip } = getPagination(req);

  const [items, total] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      where: { roomId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),
    prisma.maintenanceRequest.count({ where: { roomId } }),
  ]);

  return { items, total, page, limit };
}

export async function getMaintenanceReport(propertyId: string, startDate: Date, endDate: Date) {
  const requests = await prisma.maintenanceRequest.findMany({
    where: {
      propertyId,
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  const byStatus = requests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byCategory = requests.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byPriority = requests.reduce((acc, r) => {
    acc[r.priority] = (acc[r.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgResolutionTime = requests
    .filter((r) => r.resolvedAt)
    .map((r) => r.resolvedAt!.getTime() - r.createdAt.getTime())
    .reduce((sum, d, _, arr) => sum + d / arr.length, 0);

  return {
    total: requests.length,
    byStatus,
    byCategory,
    byPriority,
    avgResolutionHours: Math.round(avgResolutionTime / 3600000),
  };
}
