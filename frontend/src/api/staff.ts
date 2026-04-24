import apiClient from './client';
import type { StaffMember, User, ApiResponse, PaginatedResponse } from '../types';

export const staffApi = {
  getStaff: async (params: Record<string, unknown> = {}): Promise<PaginatedResponse<StaffMember>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<StaffMember>>>('/staff', { params });
    return data.data;
  },

  getStaffById: async (id: string): Promise<StaffMember> => {
    const { data } = await apiClient.get<ApiResponse<StaffMember>>(`/staff/${id}`);
    return data.data;
  },

  createStaff: async (staff: Partial<StaffMember & { user: Partial<User> }>): Promise<StaffMember> => {
    const { data } = await apiClient.post<ApiResponse<StaffMember>>('/staff', staff);
    return data.data;
  },

  updateStaff: async (id: string, staff: Partial<StaffMember>): Promise<StaffMember> => {
    const { data } = await apiClient.put<ApiResponse<StaffMember>>(`/staff/${id}`, staff);
    return data.data;
  },

  deleteStaff: async (id: string): Promise<void> => {
    await apiClient.delete(`/staff/${id}`);
  },
};
