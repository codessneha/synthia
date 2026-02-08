const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    // Create Redis client
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: process.env.REDIS_DB || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true
    });

    // Event handlers
    redisClient.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client is ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error:', err);
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });

    // Wait for connection to be established
    await redisClient.ping();
    logger.info('Redis connected successfully');

    return redisClient;
  } catch (error) {
    logger.error('Redis connection error:', error);
    // Don't exit process - allow app to run without Redis cache
    return null;
  }
};

// Get Redis client instance
const getRedisClient = () => {
  return redisClient;
};

// Cache helper functions
const cacheHelpers = {
  /**
   * Get value from cache
   */
  async get(key) {
    if (!redisClient) return null;
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis get error:', error);
      return null;
    }
  },

  /**
   * Set value in cache with TTL (in seconds)
   */
  async set(key, value, ttl = 3600) {
    if (!redisClient) return false;
    try {
      const serialized = JSON.stringify(value);
      await redisClient.setex(key, ttl, serialized);
      return true;
    } catch (error) {
      logger.error('Redis set error:', error);
      return false;
    }
  },

  /**
   * Delete value from cache
   */
  async del(key) {
    if (!redisClient) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Redis del error:', error);
      return false;
    }
  },

  /**
   * Delete multiple keys by pattern
   */
  async delPattern(pattern) {
    if (!redisClient) return false;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
      return true;
    } catch (error) {
      logger.error('Redis delPattern error:', error);
      return false;
    }
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!redisClient) return false;
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis exists error:', error);
      return false;
    }
  },

  /**
   * Set TTL for existing key
   */
  async expire(key, ttl) {
    if (!redisClient) return false;
    try {
      await redisClient.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Redis expire error:', error);
      return false;
    }
  },

  /**
   * Increment counter
   */
  async incr(key) {
    if (!redisClient) return null;
    try {
      return await redisClient.incr(key);
    } catch (error) {
      logger.error('Redis incr error:', error);
      return null;
    }
  }
};

// Check Redis health
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

// Graceful shutdown
const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  cacheHelpers,
  checkRedisHealth,
  disconnectRedis
};