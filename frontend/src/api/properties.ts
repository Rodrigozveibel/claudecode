import apiClient from './client';
import type { Property, ApiResponse } from '../types';

export const propertiesApi = {
  getAll: async (): Promise<Property[]> => {
    const { data } = await apiClient.get<ApiResponse<Property[]>>('/properties');
    return data.data;
  },

  getById: async (id: string): Promise<Property> => {
    const { data } = await apiClient.get<ApiResponse<Property>>(`/properties/${id}`);
    return data.data;
  },

  create: async (property: Partial<Property>): Promise<Property> => {
    const { data } = await apiClient.post<ApiResponse<Property>>('/properties', property);
    return data.data;
  },

  update: async (id: string, property: Partial<Property>): Promise<Property> => {
    const { data } = await apiClient.put<ApiResponse<Property>>(`/properties/${id}`, property);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/properties/${id}`);
  },
};
