import prisma from "../../config/database";
import { QuoteStatus } from "@prisma/client";
import { roomService } from "./room.service";

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export interface QuoteRequest {
  guestId: string;
  roomType: string;
  checkIn: Date;
  checkOut: Date;
  guests?: number;
}

export const quoteService = {
  async list() {
    return prisma.quote.findMany({
      orderBy: { createdAt: "desc" },
      include: { guest: true },
    });
  },

  /**
   * Build and persist a quote for the cheapest available room matching the
   * requested type. Returns the quote plus a human-friendly summary.
   */
  async createQuote(req: QuoteRequest) {
    const { guestId, roomType, checkIn, checkOut, guests } = req;
    const nights = nightsBetween(checkIn, checkOut);

    const available = await roomService.checkAvailability({
      checkIn,
      checkOut,
      roomType,
      guests,
    });

    if (available.length === 0) {
      return { available: false as const, quote: null, nights };
    }

    const room = available[0];
    const price = room.rate * nights;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const quote = await prisma.quote.create({
      data: {
        guestId,
        roomType: room.type,
        checkIn,
        checkOut,
        nights,
        price,
        status: QuoteStatus.ATIVA,
        expiresAt,
      },
    });

    return {
      available: true as const,
      quote,
      room,
      nights,
      pricePerNight: room.rate,
      total: price,
    };
  },

  async getActiveByGuest(guestId: string) {
    return prisma.quote.findFirst({
      where: { guestId, status: QuoteStatus.ATIVA },
      orderBy: { createdAt: "desc" },
    });
  },

  async markConverted(id: string) {
    return prisma.quote.update({
      where: { id },
      data: { status: QuoteStatus.CONVERTIDA },
    });
  },

  /** Expire quotes whose expiresAt has passed (called by scheduler). */
  async expireStale() {
    const result = await prisma.quote.updateMany({
      where: { status: QuoteStatus.ATIVA, expiresAt: { lt: new Date() } },
      data: { status: QuoteStatus.EXPIRADA },
    });
    return result.count;
  },
};

export default quoteService;
