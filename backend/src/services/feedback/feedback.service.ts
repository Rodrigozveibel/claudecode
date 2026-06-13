import prisma from "../../config/database";

export const feedbackService = {
  async list() {
    return prisma.feedback.findMany({
      orderBy: { createdAt: "desc" },
      include: { guest: true },
    });
  },

  async create(data: {
    guestId: string;
    reservationId?: string;
    rating: number;
    comment?: string;
    source?: string;
  }) {
    return prisma.feedback.create({
      data: {
        guestId: data.guestId,
        reservationId: data.reservationId,
        rating: Math.max(1, Math.min(5, data.rating)),
        comment: data.comment,
        source: data.source ?? "whatsapp",
      },
    });
  },

  /** Try to extract a 1-5 rating from a free-text WhatsApp reply. */
  parseRating(text: string): number | null {
    const stars = (text.match(/⭐|★/g) || []).length;
    if (stars >= 1 && stars <= 5) return stars;
    const num = text.match(/\b([1-5])\b/);
    if (num) return parseInt(num[1], 10);
    if (/(ótimo|excelente|adorei|perfeito|maravilh)/i.test(text)) return 5;
    if (/(bom|gostei|legal)/i.test(text)) return 4;
    if (/(regular|ok|normal)/i.test(text)) return 3;
    if (/(ruim|fraco)/i.test(text)) return 2;
    if (/(péssimo|horrível|terrível|nunca mais)/i.test(text)) return 1;
    return null;
  },

  async stats() {
    const all = await prisma.feedback.findMany();
    const count = all.length;
    const average =
      count === 0 ? 0 : all.reduce((s, f) => s + f.rating, 0) / count;
    return { average: Math.round(average * 10) / 10, count };
  },
};

export default feedbackService;
