import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';

describe('Auth routes', () => {
  let app: Express;

  beforeEach(() => {
    app = createApp({ jwtSecret: 'test-secret' });
  });

  const validUser = { name: 'Ana Silva', email: 'ana@example.com', password: 'super-secret' };

  it('POST /auth/register creates a user', async () => {
    const res = await request(app).post('/auth/register').send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.email).toBe(validUser.email);
    expect(res.body.passwordHash).toBeUndefined();
  });

  it('POST /auth/register rejects invalid input', async () => {
    const res = await request(app).post('/auth/register').send({ ...validUser, email: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('POST /auth/register rejects a duplicate email', async () => {
    await request(app).post('/auth/register').send(validUser);
    const res = await request(app).post('/auth/register').send(validUser);
    expect(res.status).toBe(409);
  });

  it('POST /auth/login returns a token for correct credentials', async () => {
    await request(app).post('/auth/register').send(validUser);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: validUser.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it('POST /auth/login rejects wrong credentials', async () => {
    await request(app).post('/auth/register').send(validUser);
    const res = await request(app)
      .post('/auth/login')
      .send({ email: validUser.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('GET /health does not require auth', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
  });
});
