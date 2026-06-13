import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type {
  RoomStatus,
  ReservationStatus,
  ConversationStatus,
  GuestSegment,
  PromotionStatus,
  PromotionSegment,
} from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value ?? 0);
}

function toDate(value: string | Date): Date {
  return typeof value === "string" ? parseISO(value) : value;
}

export function formatDate(value: string | Date, pattern = "dd/MM/yyyy"): string {
  try {
    return format(toDate(value), pattern, { locale: ptBR });
  } catch {
    return "-";
  }
}

export function formatDateTime(value: string | Date): string {
  return formatDate(value, "dd/MM/yyyy 'às' HH:mm");
}

export function formatTime(value: string | Date): string {
  return formatDate(value, "HH:mm");
}

export function formatRelative(value: string | Date): string {
  try {
    return formatDistanceToNow(toDate(value), { locale: ptBR, addSuffix: true });
  } catch {
    return "-";
  }
}

// ---- Room status ----
export const roomStatusLabels: Record<RoomStatus, string> = {
  LIVRE: "Livre",
  OCUPADO: "Ocupado",
  LIMPEZA: "Limpeza",
  MANUTENCAO: "Manutenção",
};

export const roomStatusColors: Record<RoomStatus, string> = {
  LIVRE: "bg-green-100 text-green-700 border-green-200",
  OCUPADO: "bg-red-100 text-red-700 border-red-200",
  LIMPEZA: "bg-yellow-100 text-yellow-700 border-yellow-200",
  MANUTENCAO: "bg-gray-100 text-gray-700 border-gray-200",
};

// ---- Reservation status ----
export const reservationStatusLabels: Record<ReservationStatus, string> = {
  PENDENTE: "Pendente",
  CONFIRMADA: "Confirmada",
  CANCELADA: "Cancelada",
  NO_SHOW: "No-show",
  FINALIZADA: "Finalizada",
};

export const reservationStatusColors: Record<ReservationStatus, string> = {
  CONFIRMADA: "bg-green-100 text-green-700 border-green-200",
  PENDENTE: "bg-yellow-100 text-yellow-700 border-yellow-200",
  CANCELADA: "bg-red-100 text-red-700 border-red-200",
  NO_SHOW: "bg-gray-100 text-gray-700 border-gray-200",
  FINALIZADA: "bg-blue-100 text-blue-700 border-blue-200",
};

// ---- Conversation status ----
export const conversationStatusLabels: Record<ConversationStatus, string> = {
  ACTIVE: "Ativa",
  RESOLVED: "Resolvida",
  BOT: "Bot",
  HUMAN: "Humano",
};

export const conversationStatusColors: Record<ConversationStatus, string> = {
  ACTIVE: "bg-blue-100 text-blue-700 border-blue-200",
  RESOLVED: "bg-gray-100 text-gray-700 border-gray-200",
  BOT: "bg-primary-100 text-primary-700 border-primary-200",
  HUMAN: "bg-gold-100 text-gold-700 border-gold-200",
};

// ---- Guest segment ----
export const guestSegmentLabels: Record<GuestSegment, string> = {
  LEAD: "Lead",
  PAST_GUEST: "Ex-hóspede",
  LOYAL: "Fiel",
};

export const guestSegmentColors: Record<GuestSegment, string> = {
  LEAD: "bg-yellow-100 text-yellow-700 border-yellow-200",
  PAST_GUEST: "bg-blue-100 text-blue-700 border-blue-200",
  LOYAL: "bg-gold-100 text-gold-700 border-gold-200",
};

// ---- Promotion status ----
export const promotionStatusLabels: Record<PromotionStatus, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendada",
  SENDING: "Enviando",
  SENT: "Enviada",
  CANCELLED: "Cancelada",
};

export const promotionStatusColors: Record<PromotionStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200",
  SENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
  SENT: "bg-green-100 text-green-700 border-green-200",
  CANCELLED: "bg-red-100 text-red-700 border-red-200",
};

export const promotionSegmentLabels: Record<PromotionSegment, string> = {
  ALL: "Todos",
  PAST_GUESTS: "Ex-hóspedes",
  LEADS: "Leads",
  LOYAL: "Clientes fiéis",
};

export function initials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
