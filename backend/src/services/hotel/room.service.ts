import prisma from "../../config/database";
import { RoomStatus } from "@prisma/client";

export interface AvailabilityQuery {
  checkIn: Date;
  checkOut: Date;
  roomType?: string;
  guests?: number;
}

export const roomService = {
  async list() {
    return prisma.room.findMany({ orderBy: { number: "asc" } });
  },

  async getById(id: string) {
    return prisma.room.findUnique({ where: { id } });
  },

  async create(data: {
    number: string;
    type: string;
    floor?: number;
    capacity?: number;
    rate: number;
    status?: RoomStatus;
    amenities?: string[];
    description?: string;
  }) {
    return prisma.room.create({ data });
  },

  async update(
    id: string,
    data: Partial<{
      type: string;
      floor: number;
      capacity: number;
      rate: number;
      status: RoomStatus;
      amenities: string[];
      description: string;
    }>,
  ) {
    return prisma.room.update({ where: { id }, data });
  },

  async updateStatus(id: string, status: RoomStatus) {
    return prisma.room.update({ where: { id }, data: { status } });
  },

  /**
   * Find rooms available for a date range. A room is unavailable if it has a
   * non-cancelled reservation overlapping the requested window.
   */
  async checkAvailability(query: AvailabilityQuery) {
    const { checkIn, checkOut, roomType, guests } = query;

    const where: Record<string, unknown> = {
      status: { not: RoomStatus.MANUTENCAO },
    };
    if (roomType) where.type = { contains: roomType, mode: "insensitive" };
    if (guests) where.capacity = { gte: guests };

    const rooms = await prisma.room.findMany({
      where,
      include: {
        reservations: {
          where: {
            status: { notIn: ["CANCELADA", "NO_SHOW", "FINALIZADA"] },
            // overlap test: existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        },
      },
      orderBy: { rate: "asc" },
    });

    const available = rooms.filter((r) => r.reservations.length === 0);
    return available.map((r) => {
      const { reservations, ...room } = r;
      void reservations;
      return room;
    });
  },

  async occupancyStats() {
    const total = await prisma.room.count();
    const occupied = await prisma.room.count({
      where: { status: RoomStatus.OCUPADO },
    });
    const rate = total === 0 ? 0 : Math.round((occupied / total) * 100);
    return { total, occupied, rate };
  },
};
