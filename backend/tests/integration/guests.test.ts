import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { authenticatedToken } from './testHelpers';

describe('Guest routes', () => {
  let app: Express;
  let token: string;

  beforeEach(async () => {
    app = createApp({ jwtSecret: 'test-secret' });
    token = await authenticatedToken(app);
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const validGuest = { name: 'Ana Silva', email: 'ana@example.com', document: '12345678900' };

  it('creates and lists guests', async () => {
    const createRes = await request(app).post('/guests').set(auth()).send(validGuest);
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/guests').set(auth());
    expect(listRes.body).toHaveLength(1);
  });

  it('rejects a duplicate guest email', async () => {
    await request(app).post('/guests').set(auth()).send(validGuest);
    const res = await request(app).post('/guests').set(auth()).send(validGuest);
    expect(res.status).toBe(409);
  });

  it('updates a guest', async () => {
    const created = await request(app).post('/guests').set(auth()).send(validGuest);
    const res = await request(app)
      .put(`/guests/${created.body.id}`)
      .set(auth())
      .send({ phone: '+55 11 90000-0000' });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+55 11 90000-0000');
  });

  it('deletes a guest', async () => {
    const created = await request(app).post('/guests').set(auth()).send(validGuest);
    const deleteRes = await request(app).delete(`/guests/${created.body.id}`).set(auth());
    expect(deleteRes.status).toBe(204);
  });

  it('returns 404 for an unknown guest', async () => {
    const res = await request(app).get('/guests/does-not-exist').set(auth());
    expect(res.status).toBe(404);
  });
});
