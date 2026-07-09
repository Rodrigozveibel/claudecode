export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';

export interface Room {
  id: string;
  number: string;
  type: string;
  capacity: number;
  pricePerNight: number;
  status: RoomStatus;
}

export type CreateRoomInput = Omit<Room, 'id' | 'status'> & { status?: RoomStatus };
export type UpdateRoomInput = Partial<Omit<Room, 'id'>>;
