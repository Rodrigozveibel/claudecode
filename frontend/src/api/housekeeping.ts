import apiClient from './client';
import type { HousekeepingTask, ApiResponse, PaginatedResponse } from '../types';

export const housekeepingApi = {
  getTasks: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<HousekeepingTask>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<HousekeepingTask>>>('/housekeeping', {
      params,
    });
    return data.data;
  },

  getTaskById: async (id: string): Promise<HousekeepingTask> => {
    const { data } = await apiClient.get<ApiResponse<HousekeepingTask>>(`/housekeeping/${id}`);
    return data.data;
  },

  createTask: async (task: Partial<HousekeepingTask>): Promise<HousekeepingTask> => {
    const { data } = await apiClient.post<ApiResponse<HousekeepingTask>>('/housekeeping', task);
    return data.data;
  },

  updateTask: async (id: string, task: Partial<HousekeepingTask>): Promise<HousekeepingTask> => {
    const { data } = await apiClient.put<ApiResponse<HousekeepingTask>>(`/housekeeping/${id}`, task);
    return data.data;
  },

  updateTaskStatus: async (id: string, status: string): Promise<HousekeepingTask> => {
    const { data } = await apiClient.patch<ApiResponse<HousekeepingTask>>(`/housekeeping/${id}/status`, { status });
    return data.data;
  },

  assignTask: async (id: string, userId: string): Promise<HousekeepingTask> => {
    const { data } = await apiClient.patch<ApiResponse<HousekeepingTask>>(`/housekeeping/${id}/assign`, { userId });
    return data.data;
  },

  deleteTask: async (id: string): Promise<void> => {
    await apiClient.delete(`/housekeeping/${id}`);
  },
};
