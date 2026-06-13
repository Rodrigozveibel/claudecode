"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  cn,
  conversationStatusColors,
  conversationStatusLabels,
  formatRelative,
  initials,
} from "@/lib/utils";
import { MessageSquare, Search } from "lucide-react";
import type { Conversation } from "@/types";

interface ConversationListProps {
  conversations: Conversation[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({
  conversations,
  loading,
  selectedId,
  onSelect,
}: ConversationListProps) {
  const [query, setQuery] = useState("");

  const filtered = conversations.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (c.guestName || "").toLowerCase().includes(q) ||
      c.guestPhone.toLowerCase().includes(q) ||
      (c.lastMessage || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full w-full flex-col border-r border-gray-100 sm:w-80">
      <div className="border-b border-gray-100 p-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversa..."
            className="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-gray-400">
            <MessageSquare size={28} />
            <p className="text-sm">Nenhuma conversa encontrada.</p>
          </div>
        ) : (
          <ul>
            {filtered.map((c) => {
              const active = c.id === selectedId;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => onSelect(c)}
                    className={cn(
                      "flex w-full items-start gap-3 border-l-2 px-3 py-3 text-left transition-colors",
                      active
                        ? "border-gold-400 bg-primary-50/60"
                        : "border-transparent hover:bg-gray-50"
                    )}
                  >
                    <div className="relative">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                        {initials(c.guestName || c.guestPhone)}
                      </div>
                      {c.unread > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-primary-900 ring-2 ring-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-gray-800">
                          {c.guestName || c.guestPhone}
                        </p>
                        <span className="shrink-0 text-[10px] text-gray-400">
                          {formatRelative(c.updatedAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500">
                        {c.lastMessage || "Sem mensagens"}
                      </p>
                      <Badge
                        className={cn(
                          "mt-1.5",
                          conversationStatusColors[c.status]
                        )}
                      >
                        {conversationStatusLabels[c.status]}
                      </Badge>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
