import { RoomRepository } from '../../src/repositories/roomRepository';
import { GuestRepository } from '../../src/repositories/guestRepository';
import { BookingRepository } from '../../src/repositories/bookingRepository';
import { BookingService } from '../../src/services/bookingService';
import { ConflictError, NotFoundError, ValidationError } from '../../src/utils/errors';
import { Room } from '../../src/models/room';
import { Guest } from '../../src/models/guest';

describe('BookingService', () => {
  let rooms: RoomRepository;
  let guests: GuestRepository;
  let bookings: BookingRepository;
  let service: BookingService;
  let room: Room;
  let guest: Guest;

  beforeEach(() => {
    rooms = new RoomRepository();
    guests = new GuestRepository();
    bookings = new BookingRepository();
    service = new BookingService(bookings, rooms, guests);

    room = rooms.create({ number: '101', type: 'standard', capacity: 2, pricePerNight: 100, status: 'available' });
    guest = guests.create({ name: 'Ana Silva', email: 'ana@example.com', document: '123' });
  });

  const bookingInput = () => ({ roomId: room.id, guestId: guest.id, checkIn: '2026-08-01', checkOut: '2026-08-05' });

  it('creates a booking with default status "confirmed"', () => {
    const booking = service.create(bookingInput());
    expect(booking.status).toBe('confirmed');
  });

  it('throws NotFoundError for an unknown room', () => {
    expect(() => service.create({ ...bookingInput(), roomId: 'missing' })).toThrow(NotFoundError);
  });

  it('throws NotFoundError for an unknown guest', () => {
    expect(() => service.create({ ...bookingInput(), guestId: 'missing' })).toThrow(NotFoundError);
  });

  it('rejects a malformed checkIn date', () => {
    expect(() => service.create({ ...bookingInput(), checkIn: '08/01/2026' })).toThrow(ValidationError);
  });

  it('rejects a malformed checkOut date', () => {
    expect(() => service.create({ ...bookingInput(), checkOut: 'not-a-date' })).toThrow(ValidationError);
  });

  it('rejects when checkOut is before checkIn', () => {
    expect(() =>
      service.create({ ...bookingInput(), checkIn: '2026-08-05', checkOut: '2026-08-01' }),
    ).toThrow(ValidationError);
  });

  it('rejects when checkOut equals checkIn', () => {
    expect(() =>
      service.create({ ...bookingInput(), checkIn: '2026-08-01', checkOut: '2026-08-01' }),
    ).toThrow(ValidationError);
  });

  describe('overlap detection', () => {
    beforeEach(() => {
      service.create(bookingInput()); // 2026-08-01 -> 2026-08-05
    });

    it('rejects a fully overlapping booking for the same room', () => {
      expect(() =>
        service.create({ ...bookingInput(), checkIn: '2026-08-02', checkOut: '2026-08-03' }),
      ).toThrow(ConflictError);
    });

    it('rejects a booking that overlaps only at the start', () => {
      expect(() =>
        service.create({ ...bookingInput(), checkIn: '2026-07-30', checkOut: '2026-08-02' }),
      ).toThrow(ConflictError);
    });

    it('rejects a booking that overlaps only at the end', () => {
      expect(() =>
        service.create({ ...bookingInput(), checkIn: '2026-08-04', checkOut: '2026-08-10' }),
      ).toThrow(ConflictError);
    });

    it('allows a back-to-back booking starting the day the previous one checks out', () => {
      const booking = service.create({ ...bookingInput(), checkIn: '2026-08-05', checkOut: '2026-08-08' });
      expect(booking.status).toBe('confirmed');
    });

    it('allows an overlapping booking for a different room', () => {
      const otherRoom = rooms.create({ number: '102', type: 'standard', capacity: 2, pricePerNight: 100, status: 'available' });
      const booking = service.create({ ...bookingInput(), roomId: otherRoom.id });
      expect(booking.roomId).toBe(otherRoom.id);
    });

    it('allows overlapping dates once the conflicting booking is cancelled', () => {
      const [existing] = bookings.findAll();
      service.cancel(existing.id);
      const booking = service.create({ ...bookingInput(), checkIn: '2026-08-02', checkOut: '2026-08-03' });
      expect(booking.status).toBe('confirmed');
    });
  });

  it('gets a booking by id', () => {
    const created = service.create(bookingInput());
    expect(service.getById(created.id)).toEqual(created);
  });

  it('throws NotFoundError for an unknown booking id', () => {
    expect(() => service.getById('missing')).toThrow(NotFoundError);
  });

  it('updates booking dates when the room remains available', () => {
    const created = service.create(bookingInput());
    const updated = service.update(created.id, { checkIn: '2026-08-02', checkOut: '2026-08-06' });
    expect(updated.checkIn).toBe('2026-08-02');
  });

  it('rejects updating dates into a conflict with another booking', () => {
    const created = service.create(bookingInput());
    const other = service.create({ ...bookingInput(), checkIn: '2026-09-01', checkOut: '2026-09-05' });
    expect(() =>
      service.update(other.id, { checkIn: '2026-08-02', checkOut: '2026-08-03' }),
    ).toThrow(ConflictError);
    expect(() => service.getById(created.id)).not.toThrow();
  });

  it('rejects an update that makes checkOut before checkIn', () => {
    const created = service.create(bookingInput());
    expect(() => service.update(created.id, { checkIn: '2026-08-10' })).toThrow(ValidationError);
  });

  it('cancels a booking', () => {
    const created = service.create(bookingInput());
    const cancelled = service.cancel(created.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('deletes a booking', () => {
    const created = service.create(bookingInput());
    service.delete(created.id);
    expect(() => service.getById(created.id)).toThrow(NotFoundError);
  });

  it('throws NotFoundError when deleting an unknown booking', () => {
    expect(() => service.delete('missing')).toThrow(NotFoundError);
  });
});
