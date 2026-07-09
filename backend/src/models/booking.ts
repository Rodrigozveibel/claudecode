export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';

export interface Booking {
  id: string;
  roomId: string;
  guestId: string;
  checkIn: string; // ISO date (yyyy-mm-dd)
  checkOut: string; // ISO date (yyyy-mm-dd)
  status: BookingStatus;
}

export type CreateBookingInput = Omit<Booking, 'id' | 'status'> & { status?: BookingStatus };
export type UpdateBookingInput = Partial<Omit<Booking, 'id' | 'roomId' | 'guestId'>>;
