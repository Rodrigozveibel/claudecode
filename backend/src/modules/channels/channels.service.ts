import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { ChannelName, ReservationSource } from '@prisma/client';
import { generateConfirmationNumber } from '../../utils/crypto';

export async function getChannelMappings(propertyId: string) {
  return prisma.channelMapping.findMany({
    where: { propertyId },
    include: { roomType: { select: { name: true, basePrice: true } } },
    orderBy: { channelName: 'asc' },
  });
}

export async function createChannelMapping(data: {
  propertyId: string;
  channelName: ChannelName;
  externalPropertyId?: string;
  externalRoomId?: string;
  roomTypeId?: string;
  markup?: number;
}) {
  return prisma.channelMapping.create({
    data,
    include: { roomType: { select: { name: true } } },
  });
}

export async function updateChannelMapping(id: string, data: Partial<{
  externalPropertyId: string;
  externalRoomId: string;
  roomTypeId: string;
  markup: number;
  isActive: boolean;
}>) {
  const mapping = await prisma.channelMapping.findUnique({ where: { id } });
  if (!mapping) throw new AppError('Channel mapping not found', 404);

  return prisma.channelMapping.update({
    where: { id },
    data,
    include: { roomType: { select: { name: true } } },
  });
}

export async function deleteChannelMapping(id: string) {
  const mapping = await prisma.channelMapping.findUnique({ where: { id } });
  if (!mapping) throw new AppError('Channel mapping not found', 404);

  return prisma.channelMapping.delete({ where: { id } });
}

export async function syncInventoryToChannel(propertyId: string, channelName: ChannelName) {
  const mappings = await prisma.channelMapping.findMany({
    where: { propertyId, channelName, isActive: true },
    include: { roomType: { include: { rooms: { where: { isActive: true } } } } },
  });

  const inventoryData = mappings.map((m) => ({
    channelRoomId: m.externalRoomId,
    availableRooms: m.roomType?.rooms.filter((r) => r.status === 'AVAILABLE').length ?? 0,
    lastSync: new Date().toISOString(),
  }));

  await prisma.channelMapping.updateMany({
    where: { propertyId, channelName },
    data: { lastSync: new Date() },
  });

  return { channel: channelName, synced: inventoryData.length, inventory: inventoryData };
}

export async function syncRatesToChannel(propertyId: string, channelName: ChannelName) {
  const mappings = await prisma.channelMapping.findMany({
    where: { propertyId, channelName, isActive: true },
    include: {
      roomType: {
        include: {
          rateRules: { where: { isActive: true } },
        },
      },
    },
  });

  const ratesData = mappings.map((m) => {
    const basePrice = m.roomType?.basePrice ?? 0;
    const adjustedPrice = basePrice * (1 + (m.markup || 0) / 100);

    return {
      channelRoomId: m.externalRoomId,
      rate: parseFloat(adjustedPrice.toFixed(2)),
      currency: 'USD',
    };
  });

  await prisma.channelMapping.updateMany({
    where: { propertyId, channelName },
    data: { lastSync: new Date() },
  });

  return { channel: channelName, synced: ratesData.length, rates: ratesData };
}

export async function handleChannelBookingWebhook(
  channelName: ChannelName,
  bookingData: {
    externalBookingId: string;
    externalRoomId: string;
    guestFirstName: string;
    guestLastName: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
    totalAmount: number;
  }
) {
  const mapping = await prisma.channelMapping.findFirst({
    where: { channelName, externalRoomId: bookingData.externalRoomId },
  });

  if (!mapping || !mapping.roomTypeId) {
    throw new AppError('No mapping found for this channel room', 404);
  }

  let guest = await prisma.guest.findFirst({
    where: { email: bookingData.guestEmail, propertyId: mapping.propertyId },
  });

  if (!guest) {
    guest = await prisma.guest.create({
      data: {
        propertyId: mapping.propertyId,
        firstName: bookingData.guestFirstName,
        lastName: bookingData.guestLastName,
        email: bookingData.guestEmail,
      },
    });
  }

  const sourceMap: Record<string, ReservationSource> = {
    BOOKING_COM: 'BOOKING_COM',
    EXPEDIA: 'EXPEDIA',
    AIRBNB: 'AIRBNB',
    HOTELS_COM: 'OTHER',
    OTHER: 'OTHER',
  };

  const checkIn = new Date(bookingData.checkIn);
  const checkOut = new Date(bookingData.checkOut);
  const nightsCount = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

  const reservation = await prisma.reservation.create({
    data: {
      propertyId: mapping.propertyId,
      roomTypeId: mapping.roomTypeId,
      guestId: guest.id,
      confirmationNumber: generateConfirmationNumber(),
      status: 'CONFIRMED',
      checkIn,
      checkOut,
      adults: bookingData.adults,
      children: bookingData.children ?? 0,
      nightsCount,
      roomRate: bookingData.totalAmount / nightsCount,
      totalAmount: bookingData.totalAmount,
      paidAmount: 0,
      source: sourceMap[channelName] ?? 'OTHER',
      channelBookingId: bookingData.externalBookingId,
    },
  });

  return reservation;
}

export async function getChannelStatistics(propertyId: string) {
  const reservations = await prisma.reservation.groupBy({
    by: ['source'],
    where: { propertyId, status: { not: 'CANCELLED' } },
    _count: true,
    _sum: { totalAmount: true },
  });

  return reservations.map((r) => ({
    source: r.source,
    count: r._count,
    totalRevenue: r._sum.totalAmount ?? 0,
  }));
}
