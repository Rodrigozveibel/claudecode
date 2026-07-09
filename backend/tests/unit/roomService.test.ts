import { RoomRepository } from '../../src/repositories/roomRepository';
import { RoomService } from '../../src/services/roomService';
import { ConflictError, NotFoundError, ValidationError } from '../../src/utils/errors';

describe('RoomService', () => {
  let repo: RoomRepository;
  let service: RoomService;

  beforeEach(() => {
    repo = new RoomRepository();
    service = new RoomService(repo);
  });

  const validInput = { number: '101', type: 'standard', capacity: 2, pricePerNight: 100 };

  it('creates a room with default status "available"', () => {
    const room = service.create(validInput);
    expect(room.status).toBe('available');
    expect(room.number).toBe('101');
    expect(room.id).toBeDefined();
  });

  it('rejects a room with an empty number', () => {
    expect(() => service.create({ ...validInput, number: '  ' })).toThrow(ValidationError);
  });

  it('rejects a room with zero or negative capacity', () => {
    expect(() => service.create({ ...validInput, capacity: 0 })).toThrow(ValidationError);
    expect(() => service.create({ ...validInput, capacity: -1 })).toThrow(ValidationError);
  });

  it('rejects a room with negative price', () => {
    expect(() => service.create({ ...validInput, pricePerNight: -10 })).toThrow(ValidationError);
  });

  it('rejects a duplicate room number', () => {
    service.create(validInput);
    expect(() => service.create(validInput)).toThrow(ConflictError);
  });

  it('lists all rooms', () => {
    service.create(validInput);
    service.create({ ...validInput, number: '102' });
    expect(service.list()).toHaveLength(2);
  });

  it('gets a room by id', () => {
    const created = service.create(validInput);
    expect(service.getById(created.id)).toEqual(created);
  });

  it('throws NotFoundError for an unknown id', () => {
    expect(() => service.getById('missing')).toThrow(NotFoundError);
  });

  it('updates a room', () => {
    const created = service.create(validInput);
    const updated = service.update(created.id, { status: 'maintenance' });
    expect(updated.status).toBe('maintenance');
  });

  it('rejects updating to an invalid capacity', () => {
    const created = service.create(validInput);
    expect(() => service.update(created.id, { capacity: 0 })).toThrow(ValidationError);
  });

  it('rejects updating to a negative price', () => {
    const created = service.create(validInput);
    expect(() => service.update(created.id, { pricePerNight: -5 })).toThrow(ValidationError);
  });

  it('throws NotFoundError when updating an unknown room', () => {
    expect(() => service.update('missing', { status: 'cleaning' })).toThrow(NotFoundError);
  });

  it('deletes a room', () => {
    const created = service.create(validInput);
    service.delete(created.id);
    expect(() => service.getById(created.id)).toThrow(NotFoundError);
  });

  it('throws NotFoundError when deleting an unknown room', () => {
    expect(() => service.delete('missing')).toThrow(NotFoundError);
  });
});
