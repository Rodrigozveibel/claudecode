import cron from "node-cron";
import prisma from "../../config/database";
import {
  PromotionStatus,
  TargetSegment,
  MessageDirection,
  MessageType,
} from "@prisma/client";
import { whatsappService } from "../whatsapp/whatsapp.service";
import { guestService } from "../hotel/guest.service";
import { conversationService } from "../whatsapp/conversation.service";
import { emit } from "../../config/socket";

const RATE_LIMIT_PER_MIN = 10;
const DELAY_MS = Math.ceil(60000 / RATE_LIMIT_PER_MIN); // ~6s between sends

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const promotionService = {
  async list() {
    return prisma.promotion.findMany({ orderBy: { createdAt: "desc" } });
  },

  async create(data: {
    name: string;
    message: string;
    targetSegment: TargetSegment;
    scheduledAt?: Date;
  }) {
    const targets = await guestService.listBySegment(
      data.targetSegment as "ALL" | "PAST_GUESTS" | "LEADS" | "LOYAL",
    );
    return prisma.promotion.create({
      data: {
        name: data.name,
        message: data.message,
        targetSegment: data.targetSegment,
        scheduledAt: data.scheduledAt,
        status: data.scheduledAt
          ? PromotionStatus.SCHEDULED
          : PromotionStatus.DRAFT,
        totalTargets: targets.length,
      },
    });
  },

  /**
   * Send a promotion to its segment with rate limiting (max 10 msgs/min) to
   * avoid WhatsApp bans. Emits progress events for the dashboard.
   */
  async send(promotionId: string): Promise<void> {
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
    });
    if (!promotion) throw new Error("PROMOTION_NOT_FOUND");
    if (
      promotion.status === PromotionStatus.SENDING ||
      promotion.status === PromotionStatus.SENT
    ) {
      return;
    }

    const targets = await guestService.listBySegment(
      promotion.targetSegment as "ALL" | "PAST_GUESTS" | "LEADS" | "LOYAL",
    );

    await prisma.promotion.update({
      where: { id: promotionId },
      data: {
        status: PromotionStatus.SENDING,
        totalTargets: targets.length,
        sentCount: 0,
      },
    });
    emit("promotion:progress", {
      promotionId,
      sentCount: 0,
      totalTargets: targets.length,
      status: "SENDING",
    });

    let sent = 0;
    for (const guest of targets) {
      try {
        const text = promotion.message.replace(/\{nome\}/gi, guest.name.split(" ")[0]);
        await whatsappService.sendText(guest.phone, text);

        const conversation = await conversationService.findOrCreate(
          guest.phone,
          guest.name,
          guest.id,
        );
        await conversationService.addMessage({
          conversationId: conversation.id,
          content: text,
          direction: MessageDirection.OUTBOUND,
          type: MessageType.TEXT,
          fromBot: true,
        });
        sent++;
      } catch (err) {
        console.error(
          `[promotion] failed to send to ${guest.phone}:`,
          (err as Error).message,
        );
      }

      await prisma.promotion.update({
        where: { id: promotionId },
        data: { sentCount: sent },
      });
      emit("promotion:progress", {
        promotionId,
        sentCount: sent,
        totalTargets: targets.length,
        status: "SENDING",
      });

      // Rate limit between sends (skip after the last one).
      if (sent < targets.length) await sleep(DELAY_MS);
    }

    await prisma.promotion.update({
      where: { id: promotionId },
      data: { status: PromotionStatus.SENT },
    });
    emit("promotion:progress", {
      promotionId,
      sentCount: sent,
      totalTargets: targets.length,
      status: "SENT",
    });
  },

  /** Cron: fire scheduled promotions whose time has come. */
  start() {
    cron.schedule("* * * * *", async () => {
      try {
        const due = await prisma.promotion.findMany({
          where: {
            status: PromotionStatus.SCHEDULED,
            scheduledAt: { lte: new Date() },
          },
        });
        for (const promo of due) {
          // Fire-and-forget; send() manages its own status transitions.
          this.send(promo.id).catch((err) =>
            console.error("[promotion] scheduled send error:", err.message),
          );
        }
      } catch (err) {
        console.error("[promotion] cron error:", (err as Error).message);
      }
    });
    console.log("[promotion] scheduler started (every 1 min)");
  },
};

export default promotionService;
