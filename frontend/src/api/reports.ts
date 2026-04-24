import apiClient from './client';
import type { ApiResponse } from '../types';

export interface ReportParams {
  startDate: string;
  endDate: string;
  groupBy?: string;
  roomTypeId?: string;
  channel?: string;
}

export const reportsApi = {
  getOccupancyReport: async (params: ReportParams): Promise<unknown[]> => {
    const { data } = await apiClient.get<ApiResponse<unknown[]>>('/reports/occupancy', { params });
    return data.data;
  },

  getRevenueReport: async (params: ReportParams): Promise<unknown[]> => {
    const { data } = await apiClient.get<ApiResponse<unknown[]>>('/reports/revenue', { params });
    return data.data;
  },

  getGuestReport: async (params: ReportParams): Promise<unknown[]> => {
    const { data } = await apiClient.get<ApiResponse<unknown[]>>('/reports/guests', { params });
    return data.data;
  },

  getHousekeepingReport: async (params: ReportParams): Promise<unknown[]> => {
    const { data } = await apiClient.get<ApiResponse<unknown[]>>('/reports/housekeeping', { params });
    return data.data;
  },

  exportReport: async (type: string, params: ReportParams): Promise<Blob> => {
    const { data } = await apiClient.get(`/reports/${type}/export`, {
      params,
      responseType: 'blob',
    });
    return data;
  },
};
