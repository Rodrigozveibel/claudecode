import { prisma } from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export async function checkIn(reservationId: string, processedBy: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { room: true, guest: true },
  });

  if (!reservation) throw new AppError('Reservation not found', 404);
  if (reservation.status !== 'CONFIRMED') {
    throw new AppError('Reservation must be CONFIRMED to check in', 400);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduledDate = new Date(today);

  const [updatedReservation] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: { status: 'CHECKED_IN', internalNotes: `Checked in by ${processedBy} at ${new Date().toISOString()}` },
      include: {
        guest: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, number: true } },
        roomType: { select: { name: true } },
      },
    }),
    prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: 'OCCUPIED' },
    }),
    prisma.housekeepingTask.create({
      data: {
        propertyId: reservation.propertyId,
        roomId: reservation.roomId,
        type: 'STAYOVER_CLEANING',
        status: 'PENDING',
        priority: 'MEDIUM',
        scheduledDate,
        notes: `Stayover for reservation ${reservation.confirmationNumber}`,
      },
    }),
  ]);

  return updatedReservation;
}

export async function checkOut(reservationId: string, processedBy: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { room: true, guest: true, payments: true },
  });

  if (!reservation) throw new AppError('Reservation not found', 404);
  if (reservation.status !== 'CHECKED_IN') {
    throw new AppError('Reservation must be CHECKED_IN to check out', 400);
  }

  const paidAmount = reservation.payments
    .filter((p) => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [updatedReservation] = await prisma.$transaction([
    prisma.reservation.update({
      where: { id: reservationId },
      data: {
        status: 'CHECKED_OUT',
        paidAmount,
        internalNotes: `Checked out by ${processedBy} at ${new Date().toISOString()}`,
      },
      include: {
        guest: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, number: true } },
        roomType: { select: { name: true } },
      },
    }),
    prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: 'DIRTY' },
    }),
    prisma.housekeepingTask.create({
      data: {
        propertyId: reservation.propertyId,
        roomId: reservation.roomId,
        type: 'CHECKOUT_CLEANING',
        status: 'PENDING',
        priority: 'HIGH',
        scheduledDate: today,
        notes: `Checkout cleaning for reservation ${reservation.confirmationNumber}`,
      },
    }),
    prisma.guest.update({
      where: { id: reservation.guestId },
      data: {
        totalStays: { increment: 1 },
        totalSpent: { increment: reservation.totalAmount },
        loyaltyPoints: { increment: Math.floor(reservation.totalAmount / 10) },
      },
    }),
  ]);

  return updatedReservation;
}

export async function getCurrentGuests(propertyId: string) {
  return prisma.reservation.findMany({
    where: { propertyId, status: 'CHECKED_IN' },
    include: {
      guest: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      room: { select: { id: true, number: true, floor: true } },
      roomType: { select: { name: true } },
    },
    orderBy: { checkIn: 'asc' },
  });
}
