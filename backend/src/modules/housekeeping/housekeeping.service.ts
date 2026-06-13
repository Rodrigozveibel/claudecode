import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { HousekeepingTaskStatus, HousekeepingTaskType, Priority } from '@prisma/client';
import { format } from 'date-fns';

export interface CreateTaskData {
  propertyId: string;
  roomId: string;
  type?: HousekeepingTaskType;
  priority?: Priority;
  scheduledDate: string;
  notes?: string;
  assignedToId?: string;
}

export async function getTasks(
  propertyId: string,
  filters: {
    status?: HousekeepingTaskStatus;
    date?: string;
    assignedToId?: string;
    roomId?: string;
  }
) {
  const where: Record<string, unknown> = { propertyId };
  if (filters.status) where.status = filters.status;
  if (filters.assignedToId) where.assignedToId = filters.assignedToId;
  if (filters.roomId) where.roomId = filters.roomId;
  if (filters.date) {
    const date = new Date(filters.date);
    date.setHours(0, 0, 0, 0);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    where.scheduledDate = { gte: date, lt: nextDay };
  }

  return prisma.housekeepingTask.findMany({
    where,
    include: {
      room: { select: { id: true, number: true, floor: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: 'desc' }, { scheduledDate: 'asc' }],
  });
}

export async function getTask(id: string) {
  const task = await prisma.housekeepingTask.findUnique({
    where: { id },
    include: {
      room: { select: { id: true, number: true, floor: true } },
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });
  if (!task) throw new AppError('Task not found', 404);
  return task;
}

export async function createTask(data: CreateTaskData) {
  return prisma.housekeepingTask.create({
    data: {
      propertyId: data.propertyId,
      roomId: data.roomId,
      type: data.type || 'STAYOVER_CLEANING',
      priority: data.priority || 'MEDIUM',
      scheduledDate: new Date(data.scheduledDate),
      notes: data.notes,
      assignedToId: data.assignedToId,
    },
    include: {
      room: { select: { id: true, number: true, floor: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function updateTaskStatus(id: string, status: HousekeepingTaskStatus, notes?: string) {
  const task = await prisma.housekeepingTask.findUnique({ where: { id } });
  if (!task) throw new AppError('Task not found', 404);

  const updateData: Record<string, unknown> = { status };
  if (notes) updateData.notes = notes;
  if (status === 'IN_PROGRESS' && !task.startedAt) updateData.startedAt = new Date();
  if (status === 'COMPLETED' || status === 'INSPECTED') updateData.completedAt = new Date();

  const updated = await prisma.housekeepingTask.update({
    where: { id },
    data: updateData,
    include: {
      room: { select: { id: true, number: true, floor: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  if (status === 'INSPECTED') {
    await prisma.room.update({
      where: { id: task.roomId },
      data: { status: 'AVAILABLE' },
    });
  }

  return updated;
}

export async function assignTask(id: string, assignedToId: string) {
  const task = await prisma.housekeepingTask.findUnique({ where: { id } });
  if (!task) throw new AppError('Task not found', 404);

  return prisma.housekeepingTask.update({
    where: { id },
    data: { assignedToId },
    include: {
      room: { select: { id: true, number: true, floor: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });
}

export async function getDailyReport(propertyId: string, date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const tasks = await prisma.housekeepingTask.findMany({
    where: { propertyId, scheduledDate: { gte: start, lt: end } },
    include: {
      room: { select: { id: true, number: true, floor: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ status: 'asc' }, { priority: 'desc' }],
  });

  const summary = {
    date: format(date, 'yyyy-MM-dd'),
    total: tasks.length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    inspected: tasks.filter((t) => t.status === 'INSPECTED').length,
    tasks,
  };

  return summary;
}
