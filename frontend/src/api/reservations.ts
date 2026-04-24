import apiClient from './client';
import type { Reservation, ApiResponse, PaginatedResponse, ReservationFilters } from '../types';

export const reservationsApi = {
  getReservations: async (filters: ReservationFilters = {}): Promise<PaginatedResponse<Reservation>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Reservation>>>('/reservations', {
      params: filters,
    });
    return data.data;
  },

  getReservationById: async (id: string): Promise<Reservation> => {
    const { data } = await apiClient.get<ApiResponse<Reservation>>(`/reservations/${id}`);
    return data.data;
  },

  createReservation: async (reservation: Partial<Reservation>): Promise<Reservation> => {
    const { data } = await apiClient.post<ApiResponse<Reservation>>('/reservations', reservation);
    return data.data;
  },

  updateReservation: async (id: string, reservation: Partial<Reservation>): Promise<Reservation> => {
    const { data } = await apiClient.put<ApiResponse<Reservation>>(`/reservations/${id}`, reservation);
    return data.data;
  },

  cancelReservation: async (id: string, reason?: string): Promise<Reservation> => {
    const { data } = await apiClient.post<ApiResponse<Reservation>>(`/reservations/${id}/cancel`, { reason });
    return data.data;
  },

  checkIn: async (id: string, data: Record<string, unknown>): Promise<Reservation> => {
    const { data: res } = await apiClient.post<ApiResponse<Reservation>>(`/reservations/${id}/check-in`, data);
    return res.data;
  },

  checkOut: async (id: string, data: Record<string, unknown>): Promise<Reservation> => {
    const { data: res } = await apiClient.post<ApiResponse<Reservation>>(`/reservations/${id}/check-out`, data);
    return res.data;
  },

  getTodayArrivals: async (): Promise<Reservation[]> => {
    const { data } = await apiClient.get<ApiResponse<Reservation[]>>('/reservations/today/arrivals');
    return data.data;
  },

  getTodayDepartures: async (): Promise<Reservation[]> => {
    const { data } = await apiClient.get<ApiResponse<Reservation[]>>('/reservations/today/departures');
    return data.data;
  },

  getCalendarReservations: async (startDate: string, endDate: string): Promise<Reservation[]> => {
    const { data } = await apiClient.get<ApiResponse<Reservation[]>>('/reservations/calendar', {
      params: { startDate, endDate },
    });
    return data.data;
  },
};
