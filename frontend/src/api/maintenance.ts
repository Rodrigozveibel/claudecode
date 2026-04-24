import apiClient from './client';
import type { MaintenanceRequest, ApiResponse, PaginatedResponse } from '../types';

export const maintenanceApi = {
  getRequests: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<MaintenanceRequest>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<MaintenanceRequest>>>('/maintenance', {
      params,
    });
    return data.data;
  },

  getRequestById: async (id: string): Promise<MaintenanceRequest> => {
    const { data } = await apiClient.get<ApiResponse<MaintenanceRequest>>(`/maintenance/${id}`);
    return data.data;
  },

  createRequest: async (request: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> => {
    const { data } = await apiClient.post<ApiResponse<MaintenanceRequest>>('/maintenance', request);
    return data.data;
  },

  updateRequest: async (id: string, request: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> => {
    const { data } = await apiClient.put<ApiResponse<MaintenanceRequest>>(`/maintenance/${id}`, request);
    return data.data;
  },

  updateStatus: async (id: string, status: string, notes?: string): Promise<MaintenanceRequest> => {
    const { data } = await apiClient.patch<ApiResponse<MaintenanceRequest>>(`/maintenance/${id}/status`, {
      status,
      notes,
    });
    return data.data;
  },

  assignRequest: async (id: string, userId: string): Promise<MaintenanceRequest> => {
    const { data } = await apiClient.patch<ApiResponse<MaintenanceRequest>>(`/maintenance/${id}/assign`, { userId });
    return data.data;
  },

  deleteRequest: async (id: string): Promise<void> => {
    await apiClient.delete(`/maintenance/${id}`);
  },
};
