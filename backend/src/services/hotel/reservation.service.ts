import prisma from "../../config/database";
import { ReservationStatus, RoomStatus, Prisma } from "@prisma/client";
import { roomService } from "./room.service";

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export interface CreateReservationInput {
  guestId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  guests?: number;
  notes?: string;
  status?: ReservationStatus;
}

export const reservationService = {
  async list(filters?: {
    status?: ReservationStatus;
    from?: Date;
    to?: Date;
    roomType?: string;
  }) {
    const where: Prisma.ReservationWhereInput = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.from || filters?.to) {
      where.checkIn = {};
      if (filters.from) (where.checkIn as Prisma.DateTimeFilter).gte = filters.from;
      if (filters.to) (where.checkIn as Prisma.DateTimeFilter).lte = filters.to;
    }
    if (filters?.roomType) {
      where.room = { type: { contains: filters.roomType, mode: "insensitive" } };
    }
    return prisma.reservation.findMany({
      where,
      include: { guest: true, room: true },
      orderBy: { checkIn: "desc" },
    });
  },

  async getById(id: string) {
    return prisma.reservation.findUnique({
      where: { id },
      include: { guest: true, room: true },
    });
  },

  /**
   * Create a reservation, validating that the room is actually free for the
   * window. Throws on conflict so callers can surface a friendly message.
   */
  async create(input: CreateReservationInput) {
    const { guestId, roomId, checkIn, checkOut, guests, notes, status } = input;

    const conflict = await prisma.reservation.findFirst({
      where: {
        roomId,
        status: { notIn: ["CANCELADA", "NO_SHOW", "FINALIZADA"] },
        checkIn: { lt: checkOut },
        checkOut: { gt: checkIn },
      },
    });
    if (conflict) {
      throw new Error("ROOM_UNAVAILABLE");
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) throw new Error("ROOM_NOT_FOUND");

    const nights = nightsBetween(checkIn, checkOut);
    const totalAmount = room.rate * nights;

    return prisma.reservation.create({
      data: {
        guestId,
        roomId,
        checkIn,
        checkOut,
        guests: guests ?? 1,
        notes,
        totalAmount,
        status: status ?? ReservationStatus.CONFIRMADA,
      },
      include: { guest: true, room: true },
    });
  },

  async update(
    id: string,
    data: Partial<{
      checkIn: Date;
      checkOut: Date;
      guests: number;
      notes: string;
      status: ReservationStatus;
      roomId: string;
    }>,
  ) {
    const existing = await prisma.reservation.findUnique({ where: { id } });
    if (!existing) throw new Error("RESERVATION_NOT_FOUND");

    // Recompute total if dates or room changed.
    let totalAmount: number | undefined;
    const checkIn = data.checkIn ?? existing.checkIn;
    const checkOut = data.checkOut ?? existing.checkOut;
    const roomId = data.roomId ?? existing.roomId;
    if (data.checkIn || data.checkOut || data.roomId) {
      const room = await prisma.room.findUnique({ where: { id: roomId } });
      if (room) totalAmount = room.rate * nightsBetween(checkIn, checkOut);
    }

    const updated = await prisma.reservation.update({
      where: { id },
      data: { ...data, ...(totalAmount !== undefined ? { totalAmount } : {}) },
      include: { guest: true, room: true },
    });

    // Keep room status in sync with reservation lifecycle.
    if (data.status === ReservationStatus.FINALIZADA) {
      await roomService.updateStatus(updated.roomId, RoomStatus.LIMPEZA);
    }
    return updated;
  },

  async cancel(id: string) {
    return prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CANCELADA },
      include: { guest: true, room: true },
    });
  },

  // -------------------------------------------------------------------------
  // Dashboard helpers
  // -------------------------------------------------------------------------

  async todayCount() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return prisma.reservation.count({
      where: {
        checkIn: { gte: start, lt: end },
        status: { notIn: ["CANCELADA", "NO_SHOW"] },
      },
    });
  },

  async upcomingCheckIns(days = 7) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    const rows = await prisma.reservation.findMany({
      where: {
        checkIn: { gte: start, lte: end },
        status: { in: ["CONFIRMADA", "PENDENTE"] },
      },
      include: { guest: true, room: true },
      orderBy: { checkIn: "asc" },
      take: 10,
    });
    return rows.map((r) => ({
      id: r.id,
      guestName: r.guest.name,
      roomNumber: r.room.number,
      checkIn: r.checkIn,
    }));
  },

  async upcomingCheckOuts(days = 7) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    const rows = await prisma.reservation.findMany({
      where: {
        checkOut: { gte: start, lte: end },
        status: { in: ["CONFIRMADA"] },
      },
      include: { guest: true, room: true },
      orderBy: { checkOut: "asc" },
      take: 10,
    });
    return rows.map((r) => ({
      id: r.id,
      guestName: r.guest.name,
      roomNumber: r.room.number,
      checkOut: r.checkOut,
    }));
  },

  async monthRevenue() {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const result = await prisma.reservation.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: start },
        status: { in: ["CONFIRMADA", "FINALIZADA"] },
      },
    });
    return result._sum.totalAmount ?? 0;
  },
};

export default reservationService;
