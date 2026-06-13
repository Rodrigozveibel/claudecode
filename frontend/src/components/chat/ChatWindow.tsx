"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MessageBubble } from "./MessageBubble";
import { conversationsApi } from "@/lib/api";
import { useSocket } from "@/hooks/useSocket";
import {
  conversationStatusColors,
  conversationStatusLabels,
  initials,
} from "@/lib/utils";
import {
  Bot,
  Hand,
  MessageSquare,
  Send,
  Undo2,
} from "lucide-react";
import type { Conversation, Message } from "@/types";

interface ChatWindowProps {
  conversation: Conversation | null;
  onStatusChange?: (id: string, status: Conversation["status"]) => void;
  onMessageSent?: (id: string, message: Message) => void;
  onRead?: (id: string) => void;
}

export function ChatWindow({
  conversation,
  onStatusChange,
  onMessageSent,
  onRead,
}: ChatWindowProps) {
  const socket = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Conversation["status"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const conversationId = conversation?.id ?? null;

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setStatus(null);
      return;
    }
    let mounted = true;
    setLoading(true);
    conversationsApi
      .get(conversationId)
      .then((data) => {
        if (!mounted) return;
        setMessages(data.messages || []);
        setStatus(data.conversation.status);
        onRead?.(conversationId);
      })
      .catch(() => toast.error("Erro ao carregar mensagens."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    function onNewMessage(payload: {
      conversationId: string;
      message: Message;
    }) {
      if (payload.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.some((m) => m.id === payload.message.id)
          ? prev
          : [...prev, payload.message]
      );
    }
    function onUpdated(payload: { conversation: Conversation }) {
      if (payload.conversation.id !== conversationId) return;
      setStatus(payload.conversation.status);
    }
    socket.on("message:new", onNewMessage);
    socket.on("conversation:updated", onUpdated);
    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("conversation:updated", onUpdated);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || !conversationId) return;
    setSending(true);
    try {
      const message = await conversationsApi.sendMessage(conversationId, content);
      setMessages((prev) =>
        prev.some((m) => m.id === message.id) ? prev : [...prev, message]
      );
      setInput("");
      onMessageSent?.(conversationId, message);
    } catch {
      toast.error("Falha ao enviar mensagem.");
    } finally {
      setSending(false);
    }
  }

  async function handleTakeover() {
    if (!conversationId) return;
    setActionLoading(true);
    try {
      await conversationsApi.takeover(conversationId);
      setStatus("HUMAN");
      onStatusChange?.(conversationId, "HUMAN");
      toast.success("Atendimento assumido por humano.");
    } catch {
      toast.error("Não foi possível assumir a conversa.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleHandback() {
    if (!conversationId) return;
    setActionLoading(true);
    try {
      await conversationsApi.handback(conversationId);
      setStatus("BOT");
      onStatusChange?.(conversationId, "BOT");
      toast.success("Atendimento devolvido para a IA.");
    } catch {
      toast.error("Não foi possível devolver a conversa.");
    } finally {
      setActionLoading(false);
    }
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-gray-400">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-300">
          <MessageSquare size={28} />
        </div>
        <p className="text-sm">Selecione uma conversa para começar.</p>
      </div>
    );
  }

  const isHuman = status === "HUMAN";

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
            {initials(conversation.guestName || conversation.guestPhone)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-800">
              {conversation.guestName || conversation.guestPhone}
            </p>
            <p className="truncate text-xs text-gray-500">
              {conversation.guestPhone}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status && (
            <Badge className={conversationStatusColors[status]}>
              {conversationStatusLabels[status]}
            </Badge>
          )}
          {isHuman ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleHandback}
              disabled={actionLoading}
            >
              <Undo2 size={15} /> Devolver à IA
            </Button>
          ) : (
            <Button
              size="sm"
              variant="gold"
              onClick={handleTakeover}
              disabled={actionLoading}
            >
              <Hand size={15} /> Assumir
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[var(--color-bg)] p-4 scrollbar-thin"
      >
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Carregando mensagens...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Nenhuma mensagem ainda.
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={handleSend}
        className="border-t border-gray-100 bg-white p-3"
      >
        {!isHuman && (
          <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-primary-50 px-3 py-1.5 text-xs text-primary-700">
            <Bot size={14} />
            <span>
              A IA está respondendo. Assuma a conversa para enviar mensagens manuais.
            </span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isHuman ? "Digite uma mensagem..." : "Assuma para responder..."
            }
            disabled={!isHuman || sending}
            className="h-11 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <Button
            type="submit"
            size="icon"
            className="h-11 w-11 rounded-xl"
            disabled={!isHuman || sending || !input.trim()}
          >
            <Send size={18} />
          </Button>
        </div>
      </form>
    </div>
  );
}
