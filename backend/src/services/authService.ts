import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { CreateUserInput, PublicUser } from '../models/user';
import { ConflictError, UnauthorizedError, ValidationError } from '../utils/errors';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 10;

function toPublicUser(user: { id: string; name: string; email: string; role: string }): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role as PublicUser['role'] };
}

export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwtSecret: string,
  ) {}

  async register(input: CreateUserInput): Promise<PublicUser> {
    if (!input.name.trim()) {
      throw new ValidationError('Name is required');
    }
    if (!EMAIL_RE.test(input.email)) {
      throw new ValidationError('Email is invalid');
    }
    if (input.password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters');
    }
    if (this.users.findByEmail(input.email)) {
      throw new ConflictError(`User with email "${input.email}" already exists`);
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = this.users.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? 'staff',
    });
    return toPublicUser(user);
  }

  async login(email: string, password: string): Promise<{ user: PublicUser; token: string }> {
    const user = this.users.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Invalid email or password');
    }
    const token = jwt.sign({ sub: user.id, role: user.role }, this.jwtSecret, {
      expiresIn: '8h',
    });
    return { user: toPublicUser(user), token };
  }

  verifyToken(token: string): { sub: string; role: string } {
    try {
      return jwt.verify(token, this.jwtSecret) as { sub: string; role: string };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  }
}
