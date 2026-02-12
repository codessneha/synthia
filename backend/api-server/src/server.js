import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

import { connectDB, checkDatabaseHealth } from './config/database.js';
import {
  connectRedis,
  checkRedisHealth,
  disconnectRedis
} from './config/redis.js';

import logger from './utils/logger.js';

/* ------------------------------------------------------------------
   Routes
------------------------------------------------------------------ */
import authRoutes from './routes/authRoutes.js';
import paperRoutes from './routes/paperRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import citationRoutes from './routes/citationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import searchRoutes from './routes/searchRoutes.js';

/* ------------------------------------------------------------------
   Middleware
------------------------------------------------------------------ */
import errorHandler from './middleware/errorHandler.js';
import notFound from './middleware/notFound.js';

/* ------------------------------------------------------------------
   App Init
------------------------------------------------------------------ */
const app = express();
app.set('trust proxy', 1);

/* ------------------------------------------------------------------
   Middleware
------------------------------------------------------------------ */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
    credentials: true
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

/* ------------------------------------------------------------------
   Routes
------------------------------------------------------------------ */
app.get('/health', async (req, res) => {
  const dbHealth = await checkDatabaseHealth();
  const redisHealth = await checkRedisHealth();

  const isHealthy =
    dbHealth.isHealthy &&
    (redisHealth.isHealthy || process.env.NODE_ENV === 'development');

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: dbHealth,
      redis: redisHealth
    }
  });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Synthia Research API',
    version: '1.0.0',
    health: '/health'
  });
});

const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/papers`, paperRoutes);
app.use(`${API_PREFIX}/sessions`, sessionRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/citations`, citationRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);

/* ------------------------------------------------------------------
   Error Handling
------------------------------------------------------------------ */
app.use(notFound);
app.use(errorHandler);

/* ------------------------------------------------------------------
   Server Start
------------------------------------------------------------------ */
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
  await connectDB();
  await connectRedis();

  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

/* ------------------------------------------------------------------
   Graceful Shutdown
------------------------------------------------------------------ */
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down...`);

  server.close(async () => {
    await mongoose.connection.close();
    await disconnectRedis();
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('unhandledRejection', shutdown);
process.on('uncaughtException', shutdown);

export default app;
