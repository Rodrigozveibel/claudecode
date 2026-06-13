import prisma from "../../config/database";
import type Anthropic from "@anthropic-ai/sdk";

/**
 * Build the Claude message history for a conversation from stored messages.
 * INBOUND messages become "user" turns, OUTBOUND become "assistant" turns.
 * Consecutive same-role messages are allowed by the API, so we keep it simple.
 */
export const contextService = {
  async buildHistory(
    conversationId: string,
    limit = 30,
  ): Promise<Anthropic.MessageParam[]> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });

    const history: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.direction === "INBOUND" ? "user" : "assistant",
      content: m.content,
    }));

    // The API requires the first message to be a user turn.
    while (history.length > 0 && history[0].role !== "user") {
      history.shift();
    }
    return history;
  },
};

export default contextService;
