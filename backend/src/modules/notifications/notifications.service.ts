import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPagination } from '../../utils/pagination';
import { Request } from 'express';

export async function getNotifications(userId: string, req: Request) {
  const { page, limit, skip } = getPagination(req);
  const where: Record<string, unknown> = { userId };

  if (req.query.isRead !== undefined) where.isRead = req.query.isRead === 'true';

  const [items, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { items, total, page, limit, unreadCount };
}

export async function markAsRead(id: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new AppError('Notification not found', 404);
  if (notification.userId !== userId) throw new AppError('Access denied', 403);

  return prisma.notification.update({ where: { id }, data: { isRead: true } });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

export async function sendNotification(data: {
  userId: string;
  propertyId?: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
}) {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      propertyId: data.propertyId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data as Parameters<typeof prisma.notification.create>[0]['data']['data'],
    },
  });
}

export async function sendBulkNotifications(data: {
  userIds: string[];
  propertyId?: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
}) {
  return prisma.notification.createMany({
    data: data.userIds.map((userId) => ({
      userId,
      propertyId: data.propertyId,
      type: data.type,
      title: data.title,
      message: data.message,
    })),
  });
}

export async function deleteNotification(id: string, userId: string) {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) throw new AppError('Notification not found', 404);
  if (notification.userId !== userId) throw new AppError('Access denied', 403);

  return prisma.notification.delete({ where: { id } });
}

export async function getNotificationStats(userId: string) {
  const [total, unread] = await Promise.all([
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return { total, unread };
}
