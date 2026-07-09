export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

export type PublicUser = Omit<User, 'passwordHash'>;
