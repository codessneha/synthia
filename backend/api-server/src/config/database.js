const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const options = {
      // Connection options
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 5,  // Minimum number of connections
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 10000, // Timeout for selecting a server
      family: 4, // Use IPv4
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database Name: ${conn.connection.name}`);

    // Handle connection events
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      logger.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected from MongoDB');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Mongoose connection closed due to application termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1); // Exit process with failure
  }
};

// Function to check database health
const checkDatabaseHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return {
      status: states[state],
      isHealthy: state === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  } catch (error) {
    return {
      status: 'error',
      isHealthy: false,
      error: error.message
    };
  }
};

module.exports = { connectDB, checkDatabaseHealth };