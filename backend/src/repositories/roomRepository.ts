import { InMemoryRepository } from './inMemoryRepository';
import { Room } from '../models/room';

export class RoomRepository extends InMemoryRepository<Room> {
  findByNumber(number: string): Room | undefined {
    return this.findAll().find((room) => room.number === number);
  }
}

export const roomRepository = new RoomRepository();
