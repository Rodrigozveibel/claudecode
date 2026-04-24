import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { config } from './config/env';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './modules/auth/auth.routes';
import propertiesRoutes from './modules/properties/properties.routes';
import roomsRoutes from './modules/rooms/rooms.routes';
import roomTypesRoutes from './modules/room-types/room-types.routes';
import guestsRoutes from './modules/guests/guests.routes';
import reservationsRoutes from './modules/reservations/reservations.routes';
import checkinRoutes from './modules/checkin/checkin.routes';
import housekeepingRoutes from './modules/housekeeping/housekeeping.routes';
import billingRoutes from './modules/billing/billing.routes';
import revenueRoutes from './modules/revenue/revenue.routes';
import channelsRoutes from './modules/channels/channels.routes';
import reportsRoutes from './modules/reports/reports.routes';
import staffRoutes from './modules/staff/staff.routes';
import maintenanceRoutes from './modules/maintenance/maintenance.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import crmRoutes from './modules/crm/crm.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(globalRateLimiter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/properties`, propertiesRoutes);
app.use(`${API_PREFIX}/rooms`, roomsRoutes);
app.use(`${API_PREFIX}/room-types`, roomTypesRoutes);
app.use(`${API_PREFIX}/guests`, guestsRoutes);
app.use(`${API_PREFIX}/reservations`, reservationsRoutes);
app.use(`${API_PREFIX}/checkin`, checkinRoutes);
app.use(`${API_PREFIX}/housekeeping`, housekeepingRoutes);
app.use(`${API_PREFIX}/billing`, billingRoutes);
app.use(`${API_PREFIX}/revenue`, revenueRoutes);
app.use(`${API_PREFIX}/channels`, channelsRoutes);
app.use(`${API_PREFIX}/reports`, reportsRoutes);
app.use(`${API_PREFIX}/staff`, staffRoutes);
app.use(`${API_PREFIX}/maintenance`, maintenanceRoutes);
app.use(`${API_PREFIX}/notifications`, notificationsRoutes);
app.use(`${API_PREFIX}/crm`, crmRoutes);
app.use(`${API_PREFIX}/dashboard`, dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
