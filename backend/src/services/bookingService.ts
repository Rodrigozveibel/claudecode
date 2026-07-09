import { BookingRepository } from '../repositories/bookingRepository';
import { RoomRepository } from '../repositories/roomRepository';
import { GuestRepository } from '../repositories/guestRepository';
import { Booking, CreateBookingInput, UpdateBookingInput } from '../models/booking';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const ACTIVE_STATUSES = new Set<Booking['status']>(['confirmed', 'checked_in']);

function parseDate(value: string, field: string): Date {
  if (!DATE_RE.test(value)) {
    throw new ValidationError(`${field} must be a valid date in YYYY-MM-DD format`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${field} must be a valid date in YYYY-MM-DD format`);
  }
  return date;
}

/** Two [start, end) ranges overlap when one starts before the other ends. */
function datesOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export class BookingService {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly rooms: RoomRepository,
    private readonly guests: GuestRepository,
  ) {}

  create(input: CreateBookingInput): Booking {
    if (!this.rooms.findById(input.roomId)) {
      throw new NotFoundError('Room', input.roomId);
    }
    if (!this.guests.findById(input.guestId)) {
      throw new NotFoundError('Guest', input.guestId);
    }

    const checkIn = parseDate(input.checkIn, 'checkIn');
    const checkOut = parseDate(input.checkOut, 'checkOut');
    if (checkOut <= checkIn) {
      throw new ValidationError('checkOut must be after checkIn');
    }

    this.assertRoomIsAvailable(input.roomId, checkIn, checkOut);

    return this.bookings.create({ status: 'confirmed', ...input });
  }

  private assertRoomIsAvailable(
    roomId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
  ): void {
    const conflicting = this.bookings
      .findByRoomId(roomId)
      .filter((booking) => booking.id !== excludeBookingId)
      .filter((booking) => ACTIVE_STATUSES.has(booking.status))
      .some((booking) =>
        datesOverlap(
          checkIn,
          checkOut,
          parseDate(booking.checkIn, 'checkIn'),
          parseDate(booking.checkOut, 'checkOut'),
        ),
      );

    if (conflicting) {
      throw new ConflictError('Room is not available for the requested dates');
    }
  }

  list(): Booking[] {
    return this.bookings.findAll();
  }

  getById(id: string): Booking {
    const booking = this.bookings.findById(id);
    if (!booking) throw new NotFoundError('Booking', id);
    return booking;
  }

  update(id: string, patch: UpdateBookingInput): Booking {
    const existing = this.getById(id);

    const nextCheckIn = patch.checkIn ?? existing.checkIn;
    const nextCheckOut = patch.checkOut ?? existing.checkOut;
    const checkIn = parseDate(nextCheckIn, 'checkIn');
    const checkOut = parseDate(nextCheckOut, 'checkOut');
    if (checkOut <= checkIn) {
      throw new ValidationError('checkOut must be after checkIn');
    }

    if (patch.checkIn || patch.checkOut) {
      this.assertRoomIsAvailable(existing.roomId, checkIn, checkOut, id);
    }

    const updated = this.bookings.update(id, patch);
    if (!updated) throw new NotFoundError('Booking', id);
    return updated;
  }

  cancel(id: string): Booking {
    return this.update(id, { status: 'cancelled' });
  }

  delete(id: string): void {
    this.getById(id);
    this.bookings.delete(id);
  }
}
