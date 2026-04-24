import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { Request } from 'express';
import { HousekeepingTaskStatus, HousekeepingTaskType, Priority } from '@prisma/client';

export async function getTasks(req: Request, propertyId?: string) {
  const { page, limit, skip } = getPagination(req);
  const where: Record<string, unknown> = {};

  if (propertyId) where.propertyId = propertyId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.assignedTo) where.assignedTo = req.query.assignedTo;
  if (req.query.roomId) where.roomId = req.query.roomId;
  if (req.query.type) where.type = req.query.type;
  if (req.query.date) {
    const date = new Date(req.query.date as string);
    const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    where.scheduledDate = { gte: date, lt: nextDay };
  }

  const [items, total] = await Promise.all([
    prisma.housekeepingTask.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ priority: 'asc' }, { scheduledDate: 'asc' }],
      include: {
        room: { select: { number: true, floor: true } },
        assignee: { select: { name: true, email: true } },
      },
    }),
    prisma.housekeepingTask.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function createTask(data: {
  propertyId: string;
  roomId: string;
  assignedTo?: string;
  type: HousekeepingTaskType;
  priority?: Priority;
  scheduledDate: Date;
  notes?: string;
}) {
  return prisma.housekeepingTask.create({
    data: {
      ...data,
      status: 'PENDING',
      priority: data.priority ?? 'MEDIUM',
    },
    include: {
      room: { select: { number: true, floor: true } },
      assignee: { select: { name: true } },
    },
  });
}

export async function updateTaskStatus(id: string, status: HousekeepingTaskStatus, notes?: string, userId?: string) {
  const task = await prisma.housekeepingTask.findUnique({ where: { id } });
  if (!task) throw new AppError('Task not found', 404);

  const updateData: Record<string, unknown> = { status };
  if (notes) updateData.notes = notes;

  if (status === 'IN_PROGRESS') updateData.startedAt = new Date();
  if (status === 'COMPLETED') updateData.completedAt = new Date();
  if (status === 'INSPECTED') {
    updateData.inspectedBy = userId;
    updateData.inspectedAt = new Date();
  }

  if (['COMPLETED', 'INSPECTED'].includes(status)) {
    await prisma.room.update({
      where: { id: task.roomId },
      data: { status: 'AVAILABLE' },
    });
  }

  return prisma.housekeepingTask.update({
    where: { id },
    data: updateData as Parameters<typeof prisma.housekeepingTask.update>[0]['data'],
    include: {
      room: { select: { number: true, floor: true } },
      assignee: { select: { name: true } },
    },
  });
}

export async function assignTask(id: string, assignedTo: string) {
  const task = await prisma.housekeepingTask.findUnique({ where: { id } });
  if (!task) throw new AppError('Task not found', 404);

  return prisma.housekeepingTask.update({
    where: { id },
    data: { assignedTo },
    include: { assignee: { select: { name: true, email: true } } },
  });
}

export async function bulkAssignTasks(taskIds: string[], assignedTo: string) {
  return prisma.housekeepingTask.updateMany({
    where: { id: { in: taskIds } },
    data: { assignedTo },
  });
}

export async function inspectRoom(taskId: string, inspectorId: string, passed: boolean, notes?: string) {
  const task = await prisma.housekeepingTask.findUnique({ where: { id: taskId } });
  if (!task) throw new AppError('Task not found', 404);

  if (task.status !== 'COMPLETED') {
    throw new AppError('Task must be completed before inspection', 400);
  }

  return prisma.housekeepingTask.update({
    where: { id: taskId },
    data: {
      status: passed ? 'INSPECTED' : 'ISSUE_REPORTED',
      inspectedBy: inspectorId,
      inspectedAt: new Date(),
      notes: notes ?? task.notes,
    },
  });
}

export async function getHousekeepingReport(propertyId: string, date: Date) {
  const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);

  const tasks = await prisma.housekeepingTask.findMany({
    where: {
      propertyId,
      scheduledDate: { gte: date, lt: nextDay },
    },
    include: {
      room: { select: { number: true, floor: true } },
      assignee: { select: { name: true } },
    },
  });

  const summary = {
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    inspected: tasks.filter((t) => t.status === 'INSPECTED').length,
    issues: tasks.filter((t) => t.status === 'ISSUE_REPORTED').length,
  };

  return { summary, tasks };
}
