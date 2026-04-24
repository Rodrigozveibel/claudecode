import apiClient from './client';
import type { RateRule, ApiResponse, OccupancyTrend, RevenueByChannel } from '../types';

export const revenueApi = {
  getRateRules: async (params: Record<string, unknown> = {}): Promise<RateRule[]> => {
    const { data } = await apiClient.get<ApiResponse<RateRule[]>>('/rate-rules', { params });
    return data.data;
  },

  getRateRuleById: async (id: string): Promise<RateRule> => {
    const { data } = await apiClient.get<ApiResponse<RateRule>>(`/rate-rules/${id}`);
    return data.data;
  },

  createRateRule: async (rule: Partial<RateRule>): Promise<RateRule> => {
    const { data } = await apiClient.post<ApiResponse<RateRule>>('/rate-rules', rule);
    return data.data;
  },

  updateRateRule: async (id: string, rule: Partial<RateRule>): Promise<RateRule> => {
    const { data } = await apiClient.put<ApiResponse<RateRule>>(`/rate-rules/${id}`, rule);
    return data.data;
  },

  deleteRateRule: async (id: string): Promise<void> => {
    await apiClient.delete(`/rate-rules/${id}`);
  },

  getOccupancyTrend: async (days = 30): Promise<OccupancyTrend[]> => {
    const { data } = await apiClient.get<ApiResponse<OccupancyTrend[]>>('/revenue/occupancy-trend', {
      params: { days },
    });
    return data.data;
  },

  getRevenueByChannel: async (days = 7): Promise<RevenueByChannel[]> => {
    const { data } = await apiClient.get<ApiResponse<RevenueByChannel[]>>('/revenue/by-channel', {
      params: { days },
    });
    return data.data;
  },

  getRateCalendar: async (roomTypeId: string, startDate: string, endDate: string): Promise<Record<string, number>> => {
    const { data } = await apiClient.get<ApiResponse<Record<string, number>>>('/revenue/rate-calendar', {
      params: { roomTypeId, startDate, endDate },
    });
    return data.data;
  },

  getStats: async (): Promise<{ adr: number; revpar: number; occupancy: number; totalRevenue: number }> => {
    const { data } = await apiClient.get('/revenue/stats');
    return data.data;
  },
};
