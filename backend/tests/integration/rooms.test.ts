import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { authenticatedToken } from './testHelpers';

describe('Room routes', () => {
  let app: Express;
  let token: string;

  beforeEach(async () => {
    app = createApp({ jwtSecret: 'test-secret' });
    token = await authenticatedToken(app);
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const validRoom = { number: '101', type: 'standard', capacity: 2, pricePerNight: 100 };

  it('rejects unauthenticated requests', async () => {
    const res = await request(app).get('/rooms');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a malformed token', async () => {
    const res = await request(app).get('/rooms').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });

  it('creates and lists rooms', async () => {
    const createRes = await request(app).post('/rooms').set(auth()).send(validRoom);
    expect(createRes.status).toBe(201);

    const listRes = await request(app).get('/rooms').set(auth());
    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveLength(1);
  });

  it('rejects invalid room input', async () => {
    const res = await request(app).post('/rooms').set(auth()).send({ ...validRoom, capacity: 0 });
    expect(res.status).toBe(400);
  });

  it('gets a room by id', async () => {
    const created = await request(app).post('/rooms').set(auth()).send(validRoom);
    const res = await request(app).get(`/rooms/${created.body.id}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.number).toBe('101');
  });

  it('returns 404 for an unknown room', async () => {
    const res = await request(app).get('/rooms/does-not-exist').set(auth());
    expect(res.status).toBe(404);
  });

  it('updates a room', async () => {
    const created = await request(app).post('/rooms').set(auth()).send(validRoom);
    const res = await request(app).put(`/rooms/${created.body.id}`).set(auth()).send({ status: 'maintenance' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('maintenance');
  });

  it('deletes a room', async () => {
    const created = await request(app).post('/rooms').set(auth()).send(validRoom);
    const deleteRes = await request(app).delete(`/rooms/${created.body.id}`).set(auth());
    expect(deleteRes.status).toBe(204);

    const getRes = await request(app).get(`/rooms/${created.body.id}`).set(auth());
    expect(getRes.status).toBe(404);
  });
});
