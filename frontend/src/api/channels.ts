import apiClient from './client';
import type { ChannelMapping, ApiResponse } from '../types';

export const channelsApi = {
  getChannels: async (): Promise<ChannelMapping[]> => {
    const { data } = await apiClient.get<ApiResponse<ChannelMapping[]>>('/channels');
    return data.data;
  },

  getChannelById: async (id: string): Promise<ChannelMapping> => {
    const { data } = await apiClient.get<ApiResponse<ChannelMapping>>(`/channels/${id}`);
    return data.data;
  },

  createChannel: async (channel: Partial<ChannelMapping>): Promise<ChannelMapping> => {
    const { data } = await apiClient.post<ApiResponse<ChannelMapping>>('/channels', channel);
    return data.data;
  },

  updateChannel: async (id: string, channel: Partial<ChannelMapping>): Promise<ChannelMapping> => {
    const { data } = await apiClient.put<ApiResponse<ChannelMapping>>(`/channels/${id}`, channel);
    return data.data;
  },

  syncChannel: async (id: string): Promise<void> => {
    await apiClient.post(`/channels/${id}/sync`);
  },

  toggleChannel: async (id: string, active: boolean): Promise<ChannelMapping> => {
    const { data } = await apiClient.patch<ApiResponse<ChannelMapping>>(`/channels/${id}/toggle`, { active });
    return data.data;
  },

  deleteChannel: async (id: string): Promise<void> => {
    await apiClient.delete(`/channels/${id}`);
  },
};
