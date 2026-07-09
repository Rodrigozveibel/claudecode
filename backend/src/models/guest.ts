export interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document: string;
}

export type CreateGuestInput = Omit<Guest, 'id'>;
export type UpdateGuestInput = Partial<Omit<Guest, 'id'>>;
