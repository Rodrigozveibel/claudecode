import express, { Express } from 'express';
import { RoomRepository } from './repositories/roomRepository';
import { GuestRepository } from './repositories/guestRepository';
import { BookingRepository } from './repositories/bookingRepository';
import { UserRepository } from './repositories/userRepository';
import { RoomService } from './services/roomService';
import { GuestService } from './services/guestService';
import { BookingService } from './services/bookingService';
import { AuthService } from './services/authService';
import { RoomController } from './controllers/roomController';
import { GuestController } from './controllers/guestController';
import { BookingController } from './controllers/bookingController';
import { AuthController } from './controllers/authController';
import { roomRoutes } from './routes/roomRoutes';
import { guestRoutes } from './routes/guestRoutes';
import { bookingRoutes } from './routes/bookingRoutes';
import { authRoutes } from './routes/authRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export interface AppConfig {
  jwtSecret: string;
}

/** Builds a fresh app + in-memory repositories each call, so tests get isolated state. */
export function createApp(config: AppConfig): Express {
  const rooms = new RoomRepository();
  const guests = new GuestRepository();
  const bookings = new BookingRepository();
  const users = new UserRepository();

  const roomService = new RoomService(rooms);
  const guestService = new GuestService(guests);
  const bookingService = new BookingService(bookings, rooms, guests);
  const authService = new AuthService(users, config.jwtSecret);

  const app = express();
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.use('/auth', authRoutes(new AuthController(authService)));
  app.use('/rooms', roomRoutes(new RoomController(roomService), authService));
  app.use('/guests', guestRoutes(new GuestController(guestService), authService));
  app.use('/bookings', bookingRoutes(new BookingController(bookingService), authService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
