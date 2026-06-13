"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { useConversations } from "@/hooks/useConversations";
import type { Conversation } from "@/types";

export default function ConversationsPage() {
  const { conversations, loading, error, markRead, patchConversation } =
    useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected =
    conversations.find((c) => c.id === selectedId) ?? null;

  function handleSelect(conversation: Conversation) {
    setSelectedId(conversation.id);
    markRead(conversation.id);
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-card">
      <div
        className={`${
          selectedId ? "hidden sm:flex" : "flex"
        } w-full sm:w-auto`}
      >
        <ConversationList
          conversations={conversations}
          loading={loading}
          selectedId={selectedId}
          onSelect={handleSelect}
        />
      </div>

      <div
        className={`${
          selectedId ? "flex" : "hidden sm:flex"
        } min-w-0 flex-1`}
      >
        {error ? (
          <div className="flex flex-1 items-center justify-center text-sm text-red-500">
            {error}
          </div>
        ) : (
          <ChatWindow
            conversation={selected}
            onRead={markRead}
            onStatusChange={(id, status) => patchConversation(id, { status })}
            onMessageSent={(id, message) =>
              patchConversation(id, {
                lastMessage: message.content,
                updatedAt: message.createdAt,
              })
            }
          />
        )}
      </div>
    </div>
  );
}
