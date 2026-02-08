require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

// Import routes (we'll create these next)
const authRoutes = require('./routes/auth');
const paperRoutes = require('./routes/papers');
const sessionRoutes = require('./routes/sessions');
const chatRoutes = require('./routes/chat');
const citationRoutes = require('./routes/citations');
const userRoutes = require('./routes/users');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

// Initialize Express app
const app = express();

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ===== MIDDLEWARE =====

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
  crossOriginEmbedderPolicy: false
}));

// CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3001'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP Request Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: logger.stream }));
}

// ===== ROUTES =====

// Health Check
app.get('/health', async (req, res) => {
  const { checkDatabaseHealth } = require('./config/database');
  const { checkRedisHealth } = require('./config/redis');
  
  const dbHealth = await checkDatabaseHealth();
  const redisHealth = await checkRedisHealth();
  
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    services: {
      database: dbHealth,
      redis: redisHealth
    }
  };
  
  const isHealthy = dbHealth.isHealthy && (redisHealth.isHealthy || process.env.NODE_ENV === 'development');
  
  res.status(isHealthy ? 200 : 503).json(health);
});

// API Info
app.get('/', (req, res) => {
  res.json({
    name: 'Synthia Research API',
    version: '1.0.0',
    description: 'AI-Powered Research Assistant Backend',
    documentation: '/api/docs',
    health: '/health'
  });
});

// API Routes
const API_PREFIX = '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/papers`, paperRoutes);
app.use(`${API_PREFIX}/sessions`, sessionRoutes);
app.use(`${API_PREFIX}/chat`, chatRoutes);
app.use(`${API_PREFIX}/citations`, citationRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);

// ===== ERROR HANDLING =====

// 404 Handler
app.use(notFound);

// Global Error Handler
app.use(errorHandler);

// ===== SERVER INITIALIZATION =====

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Connect to Redis (optional, won't crash if unavailable)
    await connectRedis();
    
    // Start Express Server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      logger.info(`📚 API: http://localhost:${PORT}${API_PREFIX}`);
      logger.info(`💚 Health: http://localhost:${PORT}/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connections
        const mongoose = require('mongoose');
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
        
        // Close Redis connection
        const { disconnectRedis } = require('./config/redis');
        await disconnectRedis();
        
        logger.info('All connections closed. Exiting process.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app; // Export for testing