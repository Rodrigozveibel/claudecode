import { InMemoryRepository } from './inMemoryRepository';
import { Guest } from '../models/guest';

export class GuestRepository extends InMemoryRepository<Guest> {
  findByEmail(email: string): Guest | undefined {
    return this.findAll().find((guest) => guest.email === email);
  }
}

export const guestRepository = new GuestRepository();
