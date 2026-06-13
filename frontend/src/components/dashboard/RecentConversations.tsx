"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  conversationStatusColors,
  conversationStatusLabels,
  formatRelative,
  initials,
} from "@/lib/utils";
import { ArrowRight, MessageSquare } from "lucide-react";
import type { Conversation } from "@/types";

interface RecentConversationsProps {
  conversations: Conversation[];
  loading: boolean;
}

export function RecentConversations({
  conversations,
  loading,
}: RecentConversationsProps) {
  const recent = conversations.slice(0, 6);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Conversas recentes</CardTitle>
        <Link
          href="/conversations"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-800"
        >
          Ver todas <ArrowRight size={14} />
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-gray-400">
            <MessageSquare size={28} />
            <p className="text-sm">Nenhuma conversa por enquanto.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recent.map((c) => (
              <li key={c.id}>
                <Link
                  href="/conversations"
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold text-primary-700">
                    {initials(c.guestName || c.guestPhone)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {c.guestName || c.guestPhone}
                      </p>
                      <span className="shrink-0 text-[11px] text-gray-400">
                        {formatRelative(c.updatedAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      {c.lastMessage || "Sem mensagens"}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge className={conversationStatusColors[c.status]}>
                      {conversationStatusLabels[c.status]}
                    </Badge>
                    {c.unread > 0 && (
                      <span className="rounded-full bg-gold-400 px-1.5 text-[10px] font-bold text-primary-900">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
