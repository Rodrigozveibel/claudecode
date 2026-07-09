import request from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/app';
import { authenticatedToken } from './testHelpers';

describe('Booking routes', () => {
  let app: Express;
  let token: string;
  let roomId: string;
  let guestId: string;

  beforeEach(async () => {
    app = createApp({ jwtSecret: 'test-secret' });
    token = await authenticatedToken(app);

    const room = await request(app)
      .post('/rooms')
      .set(auth())
      .send({ number: '101', type: 'standard', capacity: 2, pricePerNight: 100 });
    roomId = room.body.id;

    const guest = await request(app)
      .post('/guests')
      .set(auth())
      .send({ name: 'Ana Silva', email: 'ana@example.com', document: '12345678900' });
    guestId = guest.body.id;
  });

  function auth() {
    return { Authorization: `Bearer ${token}` };
  }

  const bookingInput = () => ({ roomId, guestId, checkIn: '2026-08-01', checkOut: '2026-08-05' });

  it('creates and lists bookings', async () => {
    const createRes = await request(app).post('/bookings').set(auth()).send(bookingInput());
    expect(createRes.status).toBe(201);
    expect(createRes.body.status).toBe('confirmed');

    const listRes = await request(app).get('/bookings').set(auth());
    expect(listRes.body).toHaveLength(1);
  });

  it('rejects a booking for an unknown room', async () => {
    const res = await request(app).post('/bookings').set(auth()).send({ ...bookingInput(), roomId: 'missing' });
    expect(res.status).toBe(404);
  });

  it('rejects an overlapping booking for the same room', async () => {
    await request(app).post('/bookings').set(auth()).send(bookingInput());
    const res = await request(app)
      .post('/bookings')
      .set(auth())
      .send({ ...bookingInput(), checkIn: '2026-08-02', checkOut: '2026-08-03' });
    expect(res.status).toBe(409);
  });

  it('cancels a booking', async () => {
    const created = await request(app).post('/bookings').set(auth()).send(bookingInput());
    const res = await request(app).post(`/bookings/${created.body.id}/cancel`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  it('allows a new overlapping booking after cancellation', async () => {
    const created = await request(app).post('/bookings').set(auth()).send(bookingInput());
    await request(app).post(`/bookings/${created.body.id}/cancel`).set(auth());

    const res = await request(app)
      .post('/bookings')
      .set(auth())
      .send({ ...bookingInput(), checkIn: '2026-08-02', checkOut: '2026-08-03' });
    expect(res.status).toBe(201);
  });

  it('deletes a booking', async () => {
    const created = await request(app).post('/bookings').set(auth()).send(bookingInput());
    const res = await request(app).delete(`/bookings/${created.body.id}`).set(auth());
    expect(res.status).toBe(204);
  });

  it('returns 404 for an unknown booking', async () => {
    const res = await request(app).get('/bookings/does-not-exist').set(auth());
    expect(res.status).toBe(404);
  });
});
