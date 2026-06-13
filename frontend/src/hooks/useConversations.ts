"use client";

import { useCallback, useEffect, useState } from "react";
import { conversationsApi } from "@/lib/api";
import type { Conversation, Message } from "@/types";
import { useSocket } from "./useSocket";

export function useConversations() {
  const socket = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await conversationsApi.list();
      setConversations(sortConversations(data));
    } catch {
      setError("Não foi possível carregar as conversas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function onNewMessage({
      conversationId,
      message,
    }: {
      conversationId: string;
      message: Message;
    }) {
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conversationId);
        if (!exists) {
          // Refetch list to pick up an unknown conversation.
          load();
          return prev;
        }
        const updated = prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage: message.content,
                updatedAt: message.createdAt,
                unread:
                  message.direction === "INBOUND"
                    ? (c.unread || 0) + 1
                    : c.unread,
              }
            : c
        );
        return sortConversations(updated);
      });
    }

    function onConversationUpdated({
      conversation,
    }: {
      conversation: Conversation;
    }) {
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversation.id);
        const next = exists
          ? prev.map((c) =>
              c.id === conversation.id ? { ...c, ...conversation } : c
            )
          : [conversation, ...prev];
        return sortConversations(next);
      });
    }

    function onConversationNew({ conversation }: { conversation: Conversation }) {
      setConversations((prev) => {
        if (prev.some((c) => c.id === conversation.id)) return prev;
        return sortConversations([conversation, ...prev]);
      });
    }

    socket.on("message:new", onNewMessage);
    socket.on("conversation:updated", onConversationUpdated);
    socket.on("conversation:new", onConversationNew);

    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("conversation:updated", onConversationUpdated);
      socket.off("conversation:new", onConversationNew);
    };
  }, [socket, load]);

  const markRead = useCallback((id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  }, []);

  const patchConversation = useCallback(
    (id: string, patch: Partial<Conversation>) => {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    []
  );

  return {
    conversations,
    loading,
    error,
    reload: load,
    markRead,
    patchConversation,
  };
}

function sortConversations(list: Conversation[]): Conversation[] {
  return [...list].sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}
