export type RoomStatus = "LIVRE" | "OCUPADO" | "LIMPEZA" | "MANUTENCAO";

export interface Room {
  id: string;
  number: string;
  type: string;
  floor: number;
  capacity: number;
  rate: number;
  status: RoomStatus;
  amenities: string[];
  description?: string;
}

export type GuestSegment = "LEAD" | "PAST_GUEST" | "LOYAL";

export interface Guest {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cpf?: string;
  segment: GuestSegment;
  notes?: string;
}

export type ReservationStatus =
  | "PENDENTE"
  | "CONFIRMADA"
  | "CANCELADA"
  | "NO_SHOW"
  | "FINALIZADA";

export interface Reservation {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  status: ReservationStatus;
  totalAmount: number;
  guests: number;
  notes?: string;
  guest?: Guest;
  room?: Room;
}

export type ConversationStatus = "ACTIVE" | "RESOLVED" | "BOT" | "HUMAN";

export interface Conversation {
  id: string;
  guestPhone: string;
  guestName?: string;
  status: ConversationStatus;
  unread: number;
  messages?: Message[];
  lastMessage?: string;
  updatedAt: string;
}

export type MessageDirection = "INBOUND" | "OUTBOUND";
export type MessageType = "TEXT" | "IMAGE" | "DOCUMENT" | "AUDIO";

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  direction: MessageDirection;
  type: MessageType;
  fromBot: boolean;
  createdAt: string;
}

export type PromotionSegment = "ALL" | "PAST_GUESTS" | "LEADS" | "LOYAL";
export type PromotionStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "SENDING"
  | "SENT"
  | "CANCELLED";

export interface Promotion {
  id: string;
  name: string;
  message: string;
  targetSegment: PromotionSegment;
  scheduledAt?: string;
  status: PromotionStatus;
  sentCount: number;
  totalTargets: number;
}

export interface DashboardAnalytics {
  activeConversations: number;
  reservationsToday: number;
  occupancyRate: number;
  monthRevenue: number;
  occupancyTrend: { date: string; occupancy: number }[];
  upcomingCheckIns: { id: string; guestName: string; roomNumber: string; checkIn: string }[];
  upcomingCheckOuts: { id: string; guestName: string; roomNumber: string; checkOut: string }[];
}

export interface PerformanceAnalytics {
  totalMessages: number;
  responseRate: number;
  avgResponseTimeSec: number;
  conversionRate: number;
  funnel: { inquiries: number; quotes: number; reservations: number };
  revenueTrend: { date: string; revenue: number }[];
  topRoomTypes: { type: string; count: number }[];
  satisfaction: { average: number; count: number };
}
