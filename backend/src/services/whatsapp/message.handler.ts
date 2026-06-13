import { MessageDirection, MessageType } from "@prisma/client";
import type { InboundMessage } from "./whatsapp.service";
import { whatsappService } from "./whatsapp.service";
import { conversationService } from "./conversation.service";
import { guestService } from "../hotel/guest.service";
import { contextService } from "../ai/context.service";
import { claudeService } from "../ai/claude.service";

const typeMap: Record<InboundMessage["type"], MessageType> = {
  TEXT: MessageType.TEXT,
  IMAGE: MessageType.IMAGE,
  DOCUMENT: MessageType.DOCUMENT,
  AUDIO: MessageType.AUDIO,
};

/**
 * The core inbound pipeline:
 * 1. Find/create guest + conversation
 * 2. Persist the inbound message (emits socket event)
 * 3. If the conversation is human-controlled, stop (let an agent reply)
 * 4. Otherwise run Claude with full history + tools
 * 5. Persist + send the AI reply
 */
export const messageHandler = {
  async handleInbound(inbound: InboundMessage): Promise<void> {
    if (!inbound.from || inbound.fromMe) return;

    // 1. Guest + conversation
    const guest = await guestService.findOrCreate(inbound.from, inbound.name);
    const conversation = await conversationService.findOrCreate(
      inbound.from,
      inbound.name,
      guest.id,
    );

    // 2. Store inbound message
    await conversationService.addMessage({
      conversationId: conversation.id,
      content: inbound.text,
      direction: MessageDirection.INBOUND,
      type: typeMap[inbound.type],
      mediaUrl: inbound.mediaUrl,
    });

    // 3. Human override — don't auto-respond
    if (await conversationService.isHumanControlled(conversation.id)) {
      return;
    }

    // 4. Run the AI
    const history = await contextService.buildHistory(conversation.id);
    const reply = await claudeService.respond(history, {
      guestId: guest.id,
      guestName: guest.name,
    });

    // 5. Persist + send
    await conversationService.addMessage({
      conversationId: conversation.id,
      content: reply,
      direction: MessageDirection.OUTBOUND,
      type: MessageType.TEXT,
      fromBot: true,
    });

    await whatsappService.sendText(inbound.from, reply);
  },

  /**
   * Send a manual (human agent) reply from the dashboard. Persists, sends, and
   * flips the conversation to HUMAN control.
   */
  async sendManualReply(conversationId: string, content: string): Promise<void> {
    const data = await conversationService.getById(conversationId);
    if (!data) throw new Error("CONVERSATION_NOT_FOUND");

    await conversationService.addMessage({
      conversationId,
      content,
      direction: MessageDirection.OUTBOUND,
      type: MessageType.TEXT,
      fromBot: false,
    });

    await whatsappService.sendText(data.conversation.guestPhone, content);
  },
};

export default messageHandler;
