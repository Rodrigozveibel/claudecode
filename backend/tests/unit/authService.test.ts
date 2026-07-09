import { UserRepository } from '../../src/repositories/userRepository';
import { AuthService } from '../../src/services/authService';
import { ConflictError, UnauthorizedError, ValidationError } from '../../src/utils/errors';

describe('AuthService', () => {
  let repo: UserRepository;
  let service: AuthService;

  beforeEach(() => {
    repo = new UserRepository();
    service = new AuthService(repo, 'test-secret');
  });

  const validInput = { name: 'Ana Silva', email: 'ana@example.com', password: 'super-secret' };

  it('registers a user without leaking the password hash', async () => {
    const user = await service.register(validInput);
    expect(user.email).toBe('ana@example.com');
    expect(user.role).toBe('staff');
    expect((user as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('registers an admin when role is provided', async () => {
    const user = await service.register({ ...validInput, role: 'admin' });
    expect(user.role).toBe('admin');
  });

  it('rejects an empty name', async () => {
    await expect(service.register({ ...validInput, name: ' ' })).rejects.toThrow(ValidationError);
  });

  it('rejects an invalid email', async () => {
    await expect(service.register({ ...validInput, email: 'bad' })).rejects.toThrow(ValidationError);
  });

  it('rejects a short password', async () => {
    await expect(service.register({ ...validInput, password: '123' })).rejects.toThrow(ValidationError);
  });

  it('rejects a duplicate email', async () => {
    await service.register(validInput);
    await expect(service.register(validInput)).rejects.toThrow(ConflictError);
  });

  it('logs in with correct credentials and returns a verifiable token', async () => {
    await service.register(validInput);
    const { user, token } = await service.login(validInput.email, validInput.password);
    expect(user.email).toBe(validInput.email);
    const payload = service.verifyToken(token);
    expect(payload.sub).toBe(user.id);
  });

  it('rejects login for an unknown email', async () => {
    await expect(service.login('missing@example.com', 'whatever')).rejects.toThrow(UnauthorizedError);
  });

  it('rejects login with the wrong password', async () => {
    await service.register(validInput);
    await expect(service.login(validInput.email, 'wrong-password')).rejects.toThrow(UnauthorizedError);
  });

  it('rejects an invalid or expired token', () => {
    expect(() => service.verifyToken('not-a-real-token')).toThrow(UnauthorizedError);
  });
});
