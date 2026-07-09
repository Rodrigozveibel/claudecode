import { GuestRepository } from '../repositories/guestRepository';
import { CreateGuestInput, Guest, UpdateGuestInput } from '../models/guest';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class GuestService {
  constructor(private readonly guests: GuestRepository) {}

  create(input: CreateGuestInput): Guest {
    if (!input.name.trim()) {
      throw new ValidationError('Guest name is required');
    }
    if (!EMAIL_RE.test(input.email)) {
      throw new ValidationError('Guest email is invalid');
    }
    if (!input.document.trim()) {
      throw new ValidationError('Guest document is required');
    }
    if (this.guests.findByEmail(input.email)) {
      throw new ConflictError(`Guest with email "${input.email}" already exists`);
    }
    return this.guests.create(input);
  }

  list(): Guest[] {
    return this.guests.findAll();
  }

  getById(id: string): Guest {
    const guest = this.guests.findById(id);
    if (!guest) throw new NotFoundError('Guest', id);
    return guest;
  }

  update(id: string, patch: UpdateGuestInput): Guest {
    this.getById(id);
    if (patch.email !== undefined && !EMAIL_RE.test(patch.email)) {
      throw new ValidationError('Guest email is invalid');
    }
    const updated = this.guests.update(id, patch);
    if (!updated) throw new NotFoundError('Guest', id);
    return updated;
  }

  delete(id: string): void {
    this.getById(id);
    this.guests.delete(id);
  }
}
