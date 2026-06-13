"use client";

import { cn, formatTime } from "@/lib/utils";
import { Bot, FileText, Image as ImageIcon, Mic, User } from "lucide-react";
import type { Message } from "@/types";

export function MessageBubble({ message }: { message: Message }) {
  const inbound = message.direction === "INBOUND";

  return (
    <div
      className={cn(
        "flex w-full gap-2",
        inbound ? "justify-start" : "justify-end"
      )}
    >
      {inbound && (
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
          <User size={15} />
        </div>
      )}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
          inbound
            ? "rounded-tl-sm bg-white text-gray-800 ring-1 ring-gray-100"
            : message.fromBot
            ? "rounded-tr-sm bg-primary-700 text-white"
            : "rounded-tr-sm bg-gold-400 text-primary-900"
        )}
      >
        {message.type !== "TEXT" && (
          <div
            className={cn(
              "mb-1 flex items-center gap-1.5 text-xs font-medium",
              inbound ? "text-gray-500" : "text-white/80"
            )}
          >
            <MediaIcon type={message.type} />
            <span>{mediaLabel(message.type)}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <div
          className={cn(
            "mt-1 flex items-center justify-end gap-1 text-[10px]",
            inbound
              ? "text-gray-400"
              : message.fromBot
              ? "text-blue-100/80"
              : "text-primary-900/60"
          )}
        >
          {!inbound && message.fromBot && (
            <span className="inline-flex items-center gap-0.5">
              <Bot size={11} /> IA
            </span>
          )}
          <span>{formatTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function MediaIcon({ type }: { type: Message["type"] }) {
  if (type === "IMAGE") return <ImageIcon size={13} />;
  if (type === "DOCUMENT") return <FileText size={13} />;
  if (type === "AUDIO") return <Mic size={13} />;
  return null;
}

function mediaLabel(type: Message["type"]): string {
  switch (type) {
    case "IMAGE":
      return "Imagem";
    case "DOCUMENT":
      return "Documento";
    case "AUDIO":
      return "Áudio";
    default:
      return "";
  }
}
