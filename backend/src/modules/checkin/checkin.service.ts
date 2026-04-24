import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { generateInvoiceNumber } from '../../utils/crypto';
import { differenceInDays } from 'date-fns';

export async function checkIn(reservationId: string, roomId: string, processedBy: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { guest: true, room: true },
  });

  if (!reservation) throw new AppError('Reservation not found', 404);
  if (reservation.status !== 'CONFIRMED') throw new AppError('Reservation must be confirmed to check in', 400);

  const room = await prisma.room.findUnique({ where: { id: roomId } });
  if (!room) throw new AppError('Room not found', 404);
  if (room.status !== 'AVAILABLE') throw new AppError('Room is not available', 400);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: 'CHECKED_IN', roomId },
      include: {
        guest: { select: { firstName: true, lastName: true, email: true } },
        room: { select: { number: true, floor: true } },
        roomType: { select: { name: true } },
      },
    });

    await tx.room.update({ where: { id: roomId }, data: { status: 'OCCUPIED' } });

    await tx.housekeepingTask.create({
      data: {
        propertyId: reservation.propertyId,
        roomId,
        type: 'STAYOVER_CLEANING',
        status: 'PENDING',
        priority: 'MEDIUM',
        scheduledDate: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    return updated;
  });

  return result;
}

export async function checkOut(reservationId: string, processedBy: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: {
      guest: true,
      room: true,
      roomType: true,
      addons: true,
      payments: { where: { status: 'COMPLETED' } },
    },
  });

  if (!reservation) throw new AppError('Reservation not found', 404);
  if (reservation.status !== 'CHECKED_IN') throw new AppError('Guest is not checked in', 400);
  if (!reservation.roomId) throw new AppError('No room assigned to this reservation', 400);

  const paidAmount = reservation.payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = reservation.totalAmount - paidAmount;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.reservation.update({
      where: { id: reservationId },
      data: { status: 'CHECKED_OUT', paidAmount },
    });

    await tx.room.update({
      where: { id: reservation.roomId! },
      data: { status: 'HOUSEKEEPING' },
    });

    await tx.housekeepingTask.create({
      data: {
        propertyId: reservation.propertyId,
        roomId: reservation.roomId!,
        type: 'CHECKOUT_CLEANING',
        status: 'PENDING',
        priority: 'HIGH',
        scheduledDate: new Date(),
      },
    });

    const invoiceNumber = generateInvoiceNumber();
    const subtotal = reservation.totalAmount / (1 + (reservation.roomType ? 0 : 0));
    const taxRate = 0;
    const taxes = 0;

    const invoice = await tx.invoice.create({
      data: {
        reservationId,
        guestId: reservation.guestId,
        propertyId: reservation.propertyId,
        number: invoiceNumber,
        status: balance <= 0 ? 'PAID' : 'ISSUED',
        subtotal: reservation.totalAmount,
        taxes: 0,
        discounts: 0,
        total: reservation.totalAmount,
        paidAt: balance <= 0 ? new Date() : null,
        items: {
          create: [
            {
              description: `Room: ${reservation.roomType?.name ?? ''} (${reservation.nightsCount} nights)`,
              quantity: reservation.nightsCount,
              unitPrice: reservation.roomRate,
              total: reservation.roomRate * reservation.nightsCount,
            },
            ...reservation.addons.map((a) => ({
              description: a.name,
              quantity: a.quantity,
              unitPrice: a.unitPrice,
              total: a.total,
            })),
          ],
        },
      },
      include: { items: true },
    });

    await tx.guest.update({
      where: { id: reservation.guestId },
      data: {
        totalStays: { increment: 1 },
        totalSpent: { increment: reservation.totalAmount },
        loyaltyPoints: { increment: Math.floor(reservation.totalAmount) },
      },
    });

    await tx.loyaltyTransaction.create({
      data: {
        guestId: reservation.guestId,
        reservationId,
        type: 'EARN',
        points: Math.floor(reservation.totalAmount),
        description: `Stay at ${reservation.confirmationNumber}`,
      },
    });

    return { reservation: updated, invoice, balance };
  });

  return result;
}

export async function getCurrentGuests(propertyId: string) {
  return prisma.reservation.findMany({
    where: { propertyId, status: 'CHECKED_IN' },
    include: {
      guest: { select: { firstName: true, lastName: true, email: true, phone: true } },
      room: { select: { number: true, floor: true } },
      roomType: { select: { name: true } },
    },
    orderBy: { checkIn: 'asc' },
  });
}
