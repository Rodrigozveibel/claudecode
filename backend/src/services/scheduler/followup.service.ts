import cron from "node-cron";
import prisma from "../../config/database";
import {
  FollowUpType,
  FollowUpStatus,
  MessageDirection,
  MessageType,
} from "@prisma/client";
import { whatsappService } from "../whatsapp/whatsapp.service";
import { conversationService } from "../whatsapp/conversation.service";
import { quoteService } from "../hotel/quote.service";
import { env } from "../../config/env";

interface TemplateContext {
  guestName: string;
  hotelName: string;
}

const templates: Record<FollowUpType, (c: TemplateContext) => string> = {
  QUOTE_2H: (c) =>
    `Oi ${c.guestName}! Aqui é a Sofia do ${c.hotelName} 😊 Ficou com alguma dúvida sobre o orçamento que te enviei? Posso ajudar a fechar sua reserva!`,
  QUOTE_24H: (c) =>
    `${c.guestName}, sua reserva no ${c.hotelName} ainda está disponível! As datas que você queria continuam abertas — quer garantir? 🏨`,
  QUOTE_48H: (c) =>
    `${c.guestName}, última chance! O orçamento do ${c.hotelName} expira hoje e os quartos estão acabando para essas datas. Posso confirmar pra você? ⏰`,
  QUOTE_7D: (c) =>
    `Olá ${c.guestName}! Continuamos com ótimas opções no ${c.hotelName}. Que tal planejar sua estadia? Estou à disposição. 🌟`,
  FEEDBACK: (c) =>
    `${c.guestName}, esperamos que tenha aproveitado sua estadia no ${c.hotelName}! 💛 Como você avalia sua experiência de 1 a 5 estrelas? Sua opinião é muito importante.`,
};

const delays: Record<FollowUpType, number> = {
  QUOTE_2H: 2 * 60 * 60 * 1000,
  QUOTE_24H: 24 * 60 * 60 * 1000,
  QUOTE_48H: 48 * 60 * 60 * 1000,
  QUOTE_7D: 7 * 24 * 60 * 60 * 1000,
  FEEDBACK: 0,
};

export const followupService = {
  /** Schedule the standard lead nurture sequence after a quote is generated. */
  async scheduleQuoteSequence(guestId: string, quoteId: string) {
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) return;
    const ctx = { guestName: guest.name, hotelName: env.hotel.name };
    const types: FollowUpType[] = ["QUOTE_2H", "QUOTE_24H", "QUOTE_48H"];
    for (const type of types) {
      await prisma.followUp.create({
        data: {
          guestId,
          quoteId,
          type,
          scheduledAt: new Date(Date.now() + delays[type]),
          templateMessage: templates[type](ctx),
          status: FollowUpStatus.PENDING,
        },
      });
    }
  },

  /** Schedule a post-checkout feedback request. */
  async scheduleFeedback(guestId: string, reservationId: string, checkOut: Date) {
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest) return;
    const ctx = { guestName: guest.name, hotelName: env.hotel.name };
    await prisma.followUp.create({
      data: {
        guestId,
        reservationId,
        type: FollowUpType.FEEDBACK,
        // a few hours after checkout
        scheduledAt: new Date(checkOut.getTime() + 4 * 60 * 60 * 1000),
        templateMessage: templates.FEEDBACK(ctx),
        status: FollowUpStatus.PENDING,
      },
    });
  },

  /** Cancel pending follow-ups for a guest (e.g. once they convert). */
  async cancelPendingForGuest(guestId: string, types?: FollowUpType[]) {
    await prisma.followUp.updateMany({
      where: {
        guestId,
        status: FollowUpStatus.PENDING,
        ...(types ? { type: { in: types } } : {}),
      },
      data: { status: FollowUpStatus.CANCELLED },
    });
  },

  /** Process all due follow-ups. Idempotent — flips status to SENT. */
  async processDue(): Promise<number> {
    const due = await prisma.followUp.findMany({
      where: {
        status: FollowUpStatus.PENDING,
        scheduledAt: { lte: new Date() },
      },
      include: { guest: true },
      take: 50,
    });

    let sent = 0;
    for (const fu of due) {
      // Skip nurture messages if the guest already converted.
      if (fu.quoteId) {
        const quote = await prisma.quote.findUnique({ where: { id: fu.quoteId } });
        if (quote && quote.status === "CONVERTIDA") {
          await prisma.followUp.update({
            where: { id: fu.id },
            data: { status: FollowUpStatus.CANCELLED },
          });
          continue;
        }
      }

      try {
        await whatsappService.sendText(fu.guest.phone, fu.templateMessage);

        // Log into the conversation so the dashboard reflects it.
        const conversation = await conversationService.findOrCreate(
          fu.guest.phone,
          fu.guest.name,
          fu.guestId,
        );
        await conversationService.addMessage({
          conversationId: conversation.id,
          content: fu.templateMessage,
          direction: MessageDirection.OUTBOUND,
          type: MessageType.TEXT,
          fromBot: true,
        });

        await prisma.followUp.update({
          where: { id: fu.id },
          data: { status: FollowUpStatus.SENT },
        });
        sent++;
      } catch (err) {
        console.error(`[followup] failed to send ${fu.id}:`, (err as Error).message);
      }
    }
    return sent;
  },

  /** Register the cron job (every 5 minutes). */
  start() {
    cron.schedule("*/5 * * * *", async () => {
      try {
        await quoteService.expireStale();
        const n = await this.processDue();
        if (n > 0) console.log(`[followup] sent ${n} follow-up(s)`);
      } catch (err) {
        console.error("[followup] cron error:", (err as Error).message);
      }
    });
    console.log("[followup] scheduler started (every 5 min)");
  },
};

export default followupService;
