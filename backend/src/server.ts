import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createClient } from 'redis';
import app from './app';
import { config } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { logger } from './utils/logger';

const httpServer = createServer(app);

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

export { io };

let redisClient: ReturnType<typeof createClient> | null = null;

async function connectRedis(): Promise<void> {
  try {
    redisClient = createClient({ url: config.redisUrl });
    redisClient.on('error', (err) => logger.error('Redis error', err));
    await redisClient.connect();
    logger.info('Redis connected');
  } catch (error) {
    logger.warn('Redis connection failed - continuing without cache', error);
    redisClient = null;
  }
}

export function getRedisClient() {
  return redisClient;
}

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join-property', (propertyId: string) => {
    socket.join(`property:${propertyId}`);
    logger.debug(`Socket ${socket.id} joined property:${propertyId}`);
  });

  socket.on('join-user', (userId: string) => {
    socket.join(`user:${userId}`);
    logger.debug(`Socket ${socket.id} joined user:${userId}`);
  });

  socket.on('disconnect', () => {
    logger.debug(`Socket disconnected: ${socket.id}`);
  });
});

export function emitToProperty(propertyId: string, event: string, data: unknown): void {
  io.to(`property:${propertyId}`).emit(event, data);
}

export function emitToUser(userId: string, event: string, data: unknown): void {
  io.to(`user:${userId}`).emit(event, data);
}

async function start(): Promise<void> {
  try {
    await connectDatabase();
    logger.info('Database connected');

    await connectRedis();

    const PORT = config.port;
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
      logger.info(`API base: http://localhost:${PORT}/api/v1`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(async () => {
    await disconnectDatabase();
    if (redisClient) await redisClient.quit();
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  httpServer.close(async () => {
    await disconnectDatabase();
    if (redisClient) await redisClient.quit();
    logger.info('Server closed');
    process.exit(0);
  });
});

start();
