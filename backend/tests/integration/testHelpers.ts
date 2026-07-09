import request from 'supertest';
import { Express } from 'express';

export async function authenticatedToken(app: Express): Promise<string> {
  const user = { name: 'Staff User', email: `staff-${Date.now()}-${Math.random()}@example.com`, password: 'super-secret' };
  await request(app).post('/auth/register').send(user);
  const res = await request(app).post('/auth/login').send({ email: user.email, password: user.password });
  return res.body.token;
}
