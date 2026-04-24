import apiClient from './client';
import type { Room, RoomType, ApiResponse, PaginatedResponse, RoomFilters } from '../types';

export const roomsApi = {
  getRooms: async (filters: RoomFilters = {}): Promise<PaginatedResponse<Room>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<Room>>>('/rooms', { params: filters });
    return data.data;
  },

  getRoomById: async (id: string): Promise<Room> => {
    const { data } = await apiClient.get<ApiResponse<Room>>(`/rooms/${id}`);
    return data.data;
  },

  createRoom: async (room: Partial<Room>): Promise<Room> => {
    const { data } = await apiClient.post<ApiResponse<Room>>('/rooms', room);
    return data.data;
  },

  updateRoom: async (id: string, room: Partial<Room>): Promise<Room> => {
    const { data } = await apiClient.put<ApiResponse<Room>>(`/rooms/${id}`, room);
    return data.data;
  },

  updateRoomStatus: async (id: string, status: string, notes?: string): Promise<Room> => {
    const { data } = await apiClient.patch<ApiResponse<Room>>(`/rooms/${id}/status`, { status, notes });
    return data.data;
  },

  deleteRoom: async (id: string): Promise<void> => {
    await apiClient.delete(`/rooms/${id}`);
  },

  getRoomTypes: async (): Promise<RoomType[]> => {
    const { data } = await apiClient.get<ApiResponse<RoomType[]>>('/room-types');
    return data.data;
  },

  getRoomTypeById: async (id: string): Promise<RoomType> => {
    const { data } = await apiClient.get<ApiResponse<RoomType>>(`/room-types/${id}`);
    return data.data;
  },

  createRoomType: async (roomType: Partial<RoomType>): Promise<RoomType> => {
    const { data } = await apiClient.post<ApiResponse<RoomType>>('/room-types', roomType);
    return data.data;
  },

  updateRoomType: async (id: string, roomType: Partial<RoomType>): Promise<RoomType> => {
    const { data } = await apiClient.put<ApiResponse<RoomType>>(`/room-types/${id}`, roomType);
    return data.data;
  },

  deleteRoomType: async (id: string): Promise<void> => {
    await apiClient.delete(`/room-types/${id}`);
  },

  checkAvailability: async (params: {
    checkIn: string;
    checkOut: string;
    adults: number;
    children?: number;
    roomTypeId?: string;
  }): Promise<{ rooms: Room[]; roomTypes: RoomType[] }> => {
    const { data } = await apiClient.get<ApiResponse<{ rooms: Room[]; roomTypes: RoomType[] }>>(
      '/rooms/availability',
      { params }
    );
    return data.data;
  },
};
