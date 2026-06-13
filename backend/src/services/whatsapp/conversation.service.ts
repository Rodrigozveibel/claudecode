import prisma from "../../config/database";
import {
  ConversationStatus,
  MessageDirection,
  MessageType,
} from "@prisma/client";
import { normalizePhone } from "./whatsapp.service";
import { emitToConversation, emit } from "../../config/socket";

export const conversationService = {
  async list() {
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        guest: true,
      },
    });
    return conversations.map((c) => ({
      ...c,
      lastMessage: c.messages[0]?.content ?? null,
      lastMessageAt: c.messages[0]?.createdAt ?? c.updatedAt,
      messages: undefined,
    }));
  },

  async getById(id: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: { guest: true },
    });
    if (!conversation) return null;
    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });
    return { conversation, messages };
  },

  /** Find or create a conversation for a phone number. */
  async findOrCreate(phone: string, name?: string, guestId?: string) {
    const normalized = normalizePhone(phone);
    let conversation = await prisma.conversation.findFirst({
      where: { guestPhone: normalized },
      orderBy: { updatedAt: "desc" },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          guestPhone: normalized,
          guestName: name,
          guestId,
          status: ConversationStatus.BOT,
        },
      });
      emit("conversation:new", { conversation });
    } else if ((name && !conversation.guestName) || (guestId && !conversation.guestId)) {
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          guestName: name ?? conversation.guestName,
          guestId: guestId ?? conversation.guestId,
        },
      });
    }
    return conversation;
  },

  async addMessage(params: {
    conversationId: string;
    content: string;
    direction: MessageDirection;
    type?: MessageType;
    fromBot?: boolean;
    mediaUrl?: string;
  }) {
    const message = await prisma.message.create({
      data: {
        conversationId: params.conversationId,
        content: params.content,
        direction: params.direction,
        type: params.type ?? MessageType.TEXT,
        fromBot: params.fromBot ?? false,
        mediaUrl: params.mediaUrl,
      },
    });

    const unreadDelta = params.direction === MessageDirection.INBOUND ? 1 : 0;
    const conversation = await prisma.conversation.update({
      where: { id: params.conversationId },
      data: {
        updatedAt: new Date(),
        unread: unreadDelta ? { increment: 1 } : undefined,
      },
    });

    emitToConversation(params.conversationId, "message:new", {
      conversationId: params.conversationId,
      message,
    });
    emit("conversation:updated", { conversation });
    return message;
  },

  async markRead(id: string) {
    return prisma.conversation.update({
      where: { id },
      data: { unread: 0 },
    });
  },

  async setStatus(id: string, status: ConversationStatus) {
    const conversation = await prisma.conversation.update({
      where: { id },
      data: { status },
    });
    emit("conversation:updated", { conversation });
    return conversation;
  },

  async isHumanControlled(id: string): Promise<boolean> {
    const c = await prisma.conversation.findUnique({ where: { id } });
    return c?.status === ConversationStatus.HUMAN;
  },
};

export default conversationService;
