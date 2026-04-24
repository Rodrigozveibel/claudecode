import apiClient from './client';
import type { DashboardStats, OccupancyTrend, RevenueByChannel, ApiResponse } from '../types';

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/stats');
    return data.data;
  },

  getOccupancyTrend: async (days = 30): Promise<OccupancyTrend[]> => {
    const { data } = await apiClient.get<ApiResponse<OccupancyTrend[]>>('/dashboard/occupancy-trend', {
      params: { days },
    });
    return data.data;
  },

  getRevenueByChannel: async (days = 7): Promise<RevenueByChannel[]> => {
    const { data } = await apiClient.get<ApiResponse<RevenueByChannel[]>>('/dashboard/revenue-by-channel', {
      params: { days },
    });
    return data.data;
  },
};
