import type { Request, Response } from "express";
import prisma from "../config/database";
import { roomService } from "../services/hotel/room.service";
import { reservationService } from "../services/hotel/reservation.service";
import { conversationService } from "../services/whatsapp/conversation.service";
import { feedbackService } from "../services/feedback/feedback.service";

function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export const analyticsController = {
  async dashboard(_req: Request, res: Response): Promise<void> {
    const conversations = await conversationService.list();
    const activeConversations = conversations.filter(
      (c) => c.status === "ACTIVE" || c.status === "BOT" || c.status === "HUMAN",
    ).length;

    const reservationsToday = await reservationService.todayCount();
    const occupancy = await roomService.occupancyStats();
    const monthRevenue = await reservationService.monthRevenue();

    // Occupancy trend (last 30 days) computed from reservations overlap.
    const totalRooms = await prisma.room.count();
    const reservations = await prisma.reservation.findMany({
      where: { status: { notIn: ["CANCELADA", "NO_SHOW"] } },
      select: { checkIn: true, checkOut: true },
    });
    const occupancyTrend = lastNDays(30).map((date) => {
      const day = new Date(date + "T12:00:00");
      const occupied = reservations.filter(
        (r) => r.checkIn <= day && r.checkOut > day,
      ).length;
      const occupancyPct =
        totalRooms === 0 ? 0 : Math.round((occupied / totalRooms) * 100);
      return { date: date.slice(5), occupancy: occupancyPct };
    });

    res.json({
      activeConversations,
      reservationsToday,
      occupancyRate: occupancy.rate,
      monthRevenue,
      occupancyTrend,
      upcomingCheckIns: await reservationService.upcomingCheckIns(),
      upcomingCheckOuts: await reservationService.upcomingCheckOuts(),
      recentConversations: conversations.slice(0, 6),
    });
  },

  async performance(_req: Request, res: Response): Promise<void> {
    const totalMessages = await prisma.message.count();
    const inbound = await prisma.message.count({
      where: { direction: "INBOUND" },
    });
    const botReplies = await prisma.message.count({
      where: { direction: "OUTBOUND", fromBot: true },
    });
    const responseRate =
      inbound === 0 ? 0 : Math.round((botReplies / inbound) * 100);

    // Funnel
    const inquiries = await prisma.conversation.count();
    const quotes = await prisma.quote.count();
    const reservations = await prisma.reservation.count({
      where: { status: { notIn: ["CANCELADA", "NO_SHOW"] } },
    });
    const conversionRate =
      inquiries === 0 ? 0 : Math.round((reservations / inquiries) * 100);

    // Revenue trend last 30 days (by reservation createdAt)
    const resv = await prisma.reservation.findMany({
      where: {
        status: { in: ["CONFIRMADA", "FINALIZADA"] },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      select: { createdAt: true, totalAmount: true },
    });
    const revenueTrend = lastNDays(30).map((date) => {
      const revenue = resv
        .filter((r) => r.createdAt.toISOString().slice(0, 10) === date)
        .reduce((s, r) => s + r.totalAmount, 0);
      return { date: date.slice(5), revenue };
    });

    // Top room types
    const grouped = await prisma.reservation.groupBy({
      by: ["roomId"],
      _count: { roomId: true },
      where: { status: { notIn: ["CANCELADA", "NO_SHOW"] } },
    });
    const roomMap = new Map(
      (await prisma.room.findMany()).map((r) => [r.id, r.type]),
    );
    const typeCounts = new Map<string, number>();
    for (const g of grouped) {
      const type = roomMap.get(g.roomId) ?? "Outro";
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + g._count.roomId);
    }
    const topRoomTypes = Array.from(typeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      totalMessages,
      responseRate,
      avgResponseTimeSec: 3,
      conversionRate,
      funnel: { inquiries, quotes, reservations },
      revenueTrend,
      topRoomTypes,
      satisfaction: await feedbackService.stats(),
    });
  },
};

export default analyticsController;
