import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient = null;

/* ------------------------------------------------------------------
   Redis Connection
------------------------------------------------------------------ */
const connectRedis = async () => {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true
    });

    /* --------------------------------------------------------------
       Events
    -------------------------------------------------------------- */
    redisClient.on('connect', () => {
      logger.info('Redis connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis reconnecting...');
    });

    // Ensure connection works
    await redisClient.ping();
    logger.info('✅ Redis connected');

    return redisClient;
  } catch (error) {
    logger.warn('⚠️ Redis unavailable, continuing without cache');
    logger.error(error);
    redisClient = null;
    return null;
  }
};

/* ------------------------------------------------------------------
   Client Getter
------------------------------------------------------------------ */
const getRedisClient = () => redisClient;

/* ------------------------------------------------------------------
   Cache Helpers
------------------------------------------------------------------ */
const cacheHelpers = {
  async get(key) {
    if (!redisClient) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis GET error', error);
      return null;
    }
  },

  async set(key, value, ttl = 3600) {
    if (!redisClient) return false;
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttl);
      return true;
    } catch (error) {
      logger.error('Redis SET error', error);
      return false;
    }
  },

  async del(key) {
    if (!redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error', error);
      return false;
    }
  },

  async delPattern(pattern) {
    if (!redisClient) return false;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis DEL PATTERN error', error);
      return false;
    }
  },

  async exists(key) {
    if (!redisClient) return false;
    try {
      return (await redisClient.exists(key)) === 1;
    } catch (error) {
      logger.error('Redis EXISTS error', error);
      return false;
    }
  },

  async expire(key, ttl) {
    if (!redisClient) return false;
    try {
      await redisClient.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Redis EXPIRE error', error);
      return false;
    }
  },

  async incr(key) {
    if (!redisClient) return null;
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error('Redis INCR error', error);
      return null;
    }
  }
};

/* ------------------------------------------------------------------
   Health Check
------------------------------------------------------------------ */
const checkRedisHealth = async () => {
  try {
    if (!redisClient) {
      return { status: 'disconnected', isHealthy: false };
    }
    await redisClient.ping();
    return { status: 'connected', isHealthy: true };
  } catch (error) {
    return { status: 'error', isHealthy: false, error: error.message };
  }
};

/* ------------------------------------------------------------------
   Graceful Shutdown
------------------------------------------------------------------ */
const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis disconnected');
  }
};

export {
  connectRedis,
  getRedisClient,
  cacheHelpers,
  checkRedisHealth,
  disconnectRedis
};
