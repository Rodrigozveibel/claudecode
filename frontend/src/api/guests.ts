import apiClient from './client';
import type { Guest, ApiResponse, PaginatedResponse, GuestFilters } from '../types';

export const guestsApi = {
  getGuests: async (filters: GuestFilters = {}): Promise<PaginatedResponse<Guest>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Guest>>>('/guests', { params: filters });
    return data.data;
  },

  getGuestById: async (id: string): Promise<Guest> => {
    const { data } = await apiClient.get<ApiResponse<Guest>>(`/guests/${id}`);
    return data.data;
  },

  createGuest: async (guest: Partial<Guest>): Promise<Guest> => {
    const { data } = await apiClient.post<ApiResponse<Guest>>('/guests', guest);
    return data.data;
  },

  updateGuest: async (id: string, guest: Partial<Guest>): Promise<Guest> => {
    const { data } = await apiClient.put<ApiResponse<Guest>>(`/guests/${id}`, guest);
    return data.data;
  },

  deleteGuest: async (id: string): Promise<void> => {
    await apiClient.delete(`/guests/${id}`);
  },

  searchGuests: async (query: string): Promise<Guest[]> => {
    const { data } = await apiClient.get<ApiResponse<Guest[]>>('/guests/search', { params: { q: query } });
    return data.data;
  },

  getGuestHistory: async (id: string): Promise<{ reservations: unknown[]; payments: unknown[] }> => {
    const { data } = await apiClient.get(`/guests/${id}/history`);
    return data.data;
  },
};
