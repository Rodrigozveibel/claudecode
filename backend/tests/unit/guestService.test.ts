import { GuestRepository } from '../../src/repositories/guestRepository';
import { GuestService } from '../../src/services/guestService';
import { ConflictError, NotFoundError, ValidationError } from '../../src/utils/errors';

describe('GuestService', () => {
  let repo: GuestRepository;
  let service: GuestService;

  beforeEach(() => {
    repo = new GuestRepository();
    service = new GuestService(repo);
  });

  const validInput = { name: 'Ana Silva', email: 'ana@example.com', document: '12345678900' };

  it('creates a guest', () => {
    const guest = service.create(validInput);
    expect(guest.name).toBe('Ana Silva');
    expect(guest.id).toBeDefined();
  });

  it('rejects an empty name', () => {
    expect(() => service.create({ ...validInput, name: ' ' })).toThrow(ValidationError);
  });

  it('rejects an invalid email', () => {
    expect(() => service.create({ ...validInput, email: 'not-an-email' })).toThrow(ValidationError);
  });

  it('rejects an empty document', () => {
    expect(() => service.create({ ...validInput, document: '' })).toThrow(ValidationError);
  });

  it('rejects a duplicate email', () => {
    service.create(validInput);
    expect(() => service.create({ ...validInput, document: '999' })).toThrow(ConflictError);
  });

  it('lists all guests', () => {
    service.create(validInput);
    service.create({ ...validInput, email: 'other@example.com', document: '111' });
    expect(service.list()).toHaveLength(2);
  });

  it('gets a guest by id', () => {
    const created = service.create(validInput);
    expect(service.getById(created.id)).toEqual(created);
  });

  it('throws NotFoundError for an unknown guest', () => {
    expect(() => service.getById('missing')).toThrow(NotFoundError);
  });

  it('updates a guest', () => {
    const created = service.create(validInput);
    const updated = service.update(created.id, { phone: '+55 11 99999-0000' });
    expect(updated.phone).toBe('+55 11 99999-0000');
  });

  it('rejects updating to an invalid email', () => {
    const created = service.create(validInput);
    expect(() => service.update(created.id, { email: 'bad' })).toThrow(ValidationError);
  });

  it('throws NotFoundError when updating an unknown guest', () => {
    expect(() => service.update('missing', { name: 'X' })).toThrow(NotFoundError);
  });

  it('deletes a guest', () => {
    const created = service.create(validInput);
    service.delete(created.id);
    expect(() => service.getById(created.id)).toThrow(NotFoundError);
  });

  it('throws NotFoundError when deleting an unknown guest', () => {
    expect(() => service.delete('missing')).toThrow(NotFoundError);
  });
});
