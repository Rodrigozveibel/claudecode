import type { Request, Response } from "express";
import { conversationService } from "../services/whatsapp/conversation.service";
import { messageHandler } from "../services/whatsapp/message.handler";
import { ConversationStatus } from "@prisma/client";
import { ApiError } from "../middleware/error.middleware";

export const conversationsController = {
  async list(_req: Request, res: Response): Promise<void> {
    res.json(await conversationService.list());
  },

  async get(req: Request, res: Response): Promise<void> {
    const data = await conversationService.getById(req.params.id);
    if (!data) throw new ApiError(404, "Conversa não encontrada");
    await conversationService.markRead(req.params.id);
    res.json(data);
  },

  async sendMessage(req: Request, res: Response): Promise<void> {
    const { content } = req.body as { content?: string };
    if (!content || !content.trim()) {
      throw new ApiError(400, "Mensagem vazia");
    }
    await messageHandler.sendManualReply(req.params.id, content.trim());
    res.json({ success: true });
  },

  async takeover(req: Request, res: Response): Promise<void> {
    const c = await conversationService.setStatus(
      req.params.id,
      ConversationStatus.HUMAN,
    );
    res.json(c);
  },

  async handback(req: Request, res: Response): Promise<void> {
    const c = await conversationService.setStatus(
      req.params.id,
      ConversationStatus.BOT,
    );
    res.json(c);
  },
};

export default conversationsController;
