import axios from "axios";
import type {
  Conversation,
  Message,
  Reservation,
  Room,
  Guest,
  Promotion,
  DashboardAnalytics,
  PerformanceAnalytics,
  ReservationStatus,
  PromotionSegment,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

// ---- Analytics ----
export const analyticsApi = {
  dashboard: () =>
    api.get<DashboardAnalytics>("/analytics/dashboard").then((r) => r.data),
  performance: () =>
    api.get<PerformanceAnalytics>("/analytics/performance").then((r) => r.data),
};

// ---- Conversations ----
export const conversationsApi = {
  list: () => api.get<Conversation[]>("/conversations").then((r) => r.data),
  get: (id: string) =>
    api
      .get<{ conversation: Conversation; messages: Message[] }>(
        `/conversations/${id}`
      )
      .then((r) => r.data),
  sendMessage: (id: string, content: string) =>
    api
      .post<Message>(`/conversations/${id}/messages`, { content })
      .then((r) => r.data),
  takeover: (id: string) =>
    api.post<Conversation>(`/conversations/${id}/takeover`).then((r) => r.data),
  handback: (id: string) =>
    api.post<Conversation>(`/conversations/${id}/handback`).then((r) => r.data),
};

// ---- Reservations ----
export interface ReservationFilters {
  status?: ReservationStatus | "";
  from?: string;
  to?: string;
}

export interface ReservationPayload {
  guestId?: string;
  guestName: string;
  guestPhone: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  notes?: string;
}

export const reservationsApi = {
  list: (filters: ReservationFilters = {}) =>
    api
      .get<Reservation[]>("/reservations", { params: filters })
      .then((r) => r.data),
  create: (payload: ReservationPayload) =>
    api.post<Reservation>("/reservations", payload).then((r) => r.data),
  update: (id: string, payload: Partial<Reservation>) =>
    api.patch<Reservation>(`/reservations/${id}`, payload).then((r) => r.data),
  cancel: (id: string) =>
    api.delete(`/reservations/${id}`).then((r) => r.data),
};

// ---- Rooms ----
export const roomsApi = {
  list: () => api.get<Room[]>("/rooms").then((r) => r.data),
  update: (id: string, payload: { rate?: number; status?: Room["status"] }) =>
    api.patch<Room>(`/rooms/${id}`, payload).then((r) => r.data),
};

// ---- Guests ----
export const guestsApi = {
  list: () => api.get<Guest[]>("/guests").then((r) => r.data),
};

// ---- Promotions ----
export interface PromotionPayload {
  name: string;
  message: string;
  targetSegment: PromotionSegment;
  scheduledAt?: string;
}

export const promotionsApi = {
  list: () => api.get<Promotion[]>("/promotions").then((r) => r.data),
  create: (payload: PromotionPayload) =>
    api.post<Promotion>("/promotions", payload).then((r) => r.data),
  send: (id: string) =>
    api.post<Promotion>(`/promotions/${id}/send`).then((r) => r.data),
};
