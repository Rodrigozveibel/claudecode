import apiClient from './client';
import type { Notification, ApiResponse, PaginatedResponse } from '../types';

export const notificationsApi = {
  getNotifications: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<Notification>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Notification>>>('/notifications', { params });
    return data.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await apiClient.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await apiClient.delete(`/notifications/${id}`);
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return data.data.count;
  },
};
