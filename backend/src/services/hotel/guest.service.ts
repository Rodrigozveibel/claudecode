import prisma from "../../config/database";
import { GuestSegment } from "@prisma/client";
import { normalizePhone } from "../whatsapp/whatsapp.service";

export const guestService = {
  async list() {
    return prisma.guest.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { reservations: true, quotes: true } },
      },
    });
  },

  async getById(id: string) {
    return prisma.guest.findUnique({
      where: { id },
      include: { reservations: { include: { room: true } }, quotes: true },
    });
  },

  async getByPhone(phone: string) {
    return prisma.guest.findUnique({ where: { phone: normalizePhone(phone) } });
  },

  /** Find an existing guest by phone or create a lead. */
  async findOrCreate(phone: string, name?: string) {
    const normalized = normalizePhone(phone);
    const existing = await prisma.guest.findUnique({
      where: { phone: normalized },
    });
    if (existing) {
      // Backfill the name if we learn it later.
      if (name && (!existing.name || existing.name === existing.phone)) {
        return prisma.guest.update({
          where: { id: existing.id },
          data: { name },
        });
      }
      return existing;
    }
    return prisma.guest.create({
      data: {
        phone: normalized,
        name: name ?? normalized,
        segment: GuestSegment.LEAD,
      },
    });
  },

  async create(data: {
    name: string;
    phone: string;
    email?: string;
    cpf?: string;
    segment?: GuestSegment;
    notes?: string;
  }) {
    return prisma.guest.create({
      data: { ...data, phone: normalizePhone(data.phone) },
    });
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      email: string;
      cpf: string;
      segment: GuestSegment;
      notes: string;
    }>,
  ) {
    return prisma.guest.update({ where: { id }, data });
  },

  /** Promote a lead to past guest once they complete a stay. */
  async markAsPastGuest(id: string) {
    const guest = await prisma.guest.findUnique({
      where: { id },
      include: { reservations: true },
    });
    if (!guest) return null;
    const finalized = guest.reservations.filter(
      (r) => r.status === "FINALIZADA",
    ).length;
    const segment: GuestSegment =
      finalized >= 3 ? GuestSegment.LOYAL : GuestSegment.PAST_GUEST;
    return prisma.guest.update({ where: { id }, data: { segment } });
  },

  async listBySegment(segment: "ALL" | "PAST_GUESTS" | "LEADS" | "LOYAL") {
    const map: Record<string, GuestSegment | undefined> = {
      ALL: undefined,
      PAST_GUESTS: GuestSegment.PAST_GUEST,
      LEADS: GuestSegment.LEAD,
      LOYAL: GuestSegment.LOYAL,
    };
    const seg = map[segment];
    return prisma.guest.findMany({
      where: seg ? { segment: seg } : undefined,
    });
  },
};

export default guestService;
