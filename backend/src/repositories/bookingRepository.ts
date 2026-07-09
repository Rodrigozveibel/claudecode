import { InMemoryRepository } from './inMemoryRepository';
import { Booking } from '../models/booking';

export class BookingRepository extends InMemoryRepository<Booking> {
  findByRoomId(roomId: string): Booking[] {
    return this.findAll().filter((booking) => booking.roomId === roomId);
  }
}

export const bookingRepository = new BookingRepository();
