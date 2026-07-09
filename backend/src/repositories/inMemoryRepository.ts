import { v4 as uuid } from 'uuid';

/** Generic in-memory CRUD store. Swap for a Postgres-backed implementation later
 * without changing callers, as long as they depend on this interface. */
export class InMemoryRepository<T extends { id: string }> {
  protected items = new Map<string, T>();

  create(data: Omit<T, 'id'>): T {
    const id = uuid();
    const entity = { ...data, id } as T;
    this.items.set(id, entity);
    return entity;
  }

  findAll(): T[] {
    return Array.from(this.items.values());
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }

  update(id: string, patch: Partial<Omit<T, 'id'>>): T | undefined {
    const existing = this.items.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id } as T;
    this.items.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    return this.items.delete(id);
  }

  clear(): void {
    this.items.clear();
  }
}
