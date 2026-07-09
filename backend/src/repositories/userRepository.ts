import { InMemoryRepository } from './inMemoryRepository';
import { User } from '../models/user';

export class UserRepository extends InMemoryRepository<User> {
  findByEmail(email: string): User | undefined {
    return this.findAll().find((user) => user.email === email);
  }
}

export const userRepository = new UserRepository();
