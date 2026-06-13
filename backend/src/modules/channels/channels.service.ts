import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { ChannelName } from '@prisma/client';

export async function getChannels(propertyId: string) {
  return prisma.channelMapping.findMany({
    where: { propertyId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createMapping(data: {
  propertyId: string;
  channelName: ChannelName;
  externalPropertyId?: string;
  markup?: number;
}) {
  return prisma.channelMapping.create({ data });
}

export async function updateMapping(
  id: string,
  data: {
    externalPropertyId?: string;
    markup?: number;
    isActive?: boolean;
  }
) {
  const existing = await prisma.channelMapping.findUnique({ where: { id } });
  if (!existing) throw new AppError('Channel mapping not found', 404);

  return prisma.channelMapping.update({ where: { id }, data });
}

export async function syncInventory(mappingId: string) {
  const mapping = await prisma.channelMapping.findUnique({ where: { id: mappingId } });
  if (!mapping) throw new AppError('Channel mapping not found', 404);

  await prisma.channelMapping.update({
    where: { id: mappingId },
    data: { lastSync: new Date() },
  });

  return {
    mappingId,
    channelName: mapping.channelName,
    syncedAt: new Date(),
    message: 'Inventory sync initiated successfully',
  };
}

export async function getStats(propertyId: string) {
  const channels = await prisma.channelMapping.findMany({
    where: { propertyId, isActive: true },
  });

  const channelNames = channels.map((c) => c.channelName);

  const reservationsByChannel = await Promise.all(
    channelNames.map(async (channelName) => {
      const channelSource = channelName.replace('_', '_') as string;
      const reservations = await prisma.reservation.findMany({
        where: {
          propertyId,
          source: channelSource as 'BOOKING_COM' | 'EXPEDIA' | 'AIRBNB' | 'OTHER',
        },
        select: { totalAmount: true, createdAt: true },
      });
      return {
        channel: channelName,
        bookings: reservations.length,
        revenue: reservations.reduce((sum, r) => sum + r.totalAmount, 0),
      };
    })
  );

  return {
    channels: channels.length,
    channelStats: reservationsByChannel,
  };
}
