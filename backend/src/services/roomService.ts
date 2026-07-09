import { RoomRepository } from '../repositories/roomRepository';
import { CreateRoomInput, Room, UpdateRoomInput } from '../models/room';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';

export class RoomService {
  constructor(private readonly rooms: RoomRepository) {}

  create(input: CreateRoomInput): Room {
    if (!input.number.trim()) {
      throw new ValidationError('Room number is required');
    }
    if (input.capacity <= 0) {
      throw new ValidationError('Room capacity must be greater than zero');
    }
    if (input.pricePerNight < 0) {
      throw new ValidationError('Room price cannot be negative');
    }
    if (this.rooms.findByNumber(input.number)) {
      throw new ConflictError(`Room number "${input.number}" already exists`);
    }
    return this.rooms.create({ status: 'available', ...input });
  }

  list(): Room[] {
    return this.rooms.findAll();
  }

  getById(id: string): Room {
    const room = this.rooms.findById(id);
    if (!room) throw new NotFoundError('Room', id);
    return room;
  }

  update(id: string, patch: UpdateRoomInput): Room {
    this.getById(id);
    if (patch.capacity !== undefined && patch.capacity <= 0) {
      throw new ValidationError('Room capacity must be greater than zero');
    }
    if (patch.pricePerNight !== undefined && patch.pricePerNight < 0) {
      throw new ValidationError('Room price cannot be negative');
    }
    const updated = this.rooms.update(id, patch);
    if (!updated) throw new NotFoundError('Room', id);
    return updated;
  }

  delete(id: string): void {
    this.getById(id);
    this.rooms.delete(id);
  }
}
