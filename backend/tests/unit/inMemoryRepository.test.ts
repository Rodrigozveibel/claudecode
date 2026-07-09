import { InMemoryRepository } from '../../src/repositories/inMemoryRepository';

interface Widget {
  id: string;
  label: string;
}

describe('InMemoryRepository', () => {
  let repo: InMemoryRepository<Widget>;

  beforeEach(() => {
    repo = new InMemoryRepository<Widget>();
  });

  it('creates entities with generated ids', () => {
    const widget = repo.create({ label: 'a' });
    expect(widget.id).toBeDefined();
    expect(widget.label).toBe('a');
  });

  it('finds all created entities', () => {
    repo.create({ label: 'a' });
    repo.create({ label: 'b' });
    expect(repo.findAll()).toHaveLength(2);
  });

  it('finds an entity by id', () => {
    const widget = repo.create({ label: 'a' });
    expect(repo.findById(widget.id)).toEqual(widget);
  });

  it('returns undefined for a missing id', () => {
    expect(repo.findById('missing')).toBeUndefined();
  });

  it('updates an existing entity', () => {
    const widget = repo.create({ label: 'a' });
    const updated = repo.update(widget.id, { label: 'b' });
    expect(updated?.label).toBe('b');
  });

  it('returns undefined when updating a missing entity', () => {
    expect(repo.update('missing', { label: 'b' })).toBeUndefined();
  });

  it('deletes an entity', () => {
    const widget = repo.create({ label: 'a' });
    expect(repo.delete(widget.id)).toBe(true);
    expect(repo.findById(widget.id)).toBeUndefined();
  });

  it('returns false when deleting a missing entity', () => {
    expect(repo.delete('missing')).toBe(false);
  });

  it('clears all entities', () => {
    repo.create({ label: 'a' });
    repo.clear();
    expect(repo.findAll()).toHaveLength(0);
  });
});
