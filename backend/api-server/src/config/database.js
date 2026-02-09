import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/* ------------------------------------------------------------------
   MongoDB Connection
------------------------------------------------------------------ */
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    const options = {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      family: 4
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);

    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📦 Database Name: ${conn.connection.name}`);

    // Connection Events (singleton to prevent duplicates)
    if (!mongoose.connection._eventsRegistered) {
      mongoose.connection.on('connected', () => logger.info('Mongoose connected'));
      mongoose.connection.on('error', (err) => logger.error('Mongoose connection error', err));
      mongoose.connection.on('disconnected', () => logger.warn('Mongoose disconnected'));
      mongoose.connection._eventsRegistered = true;
    }

    return conn;
  } catch (error) {
    logger.error('❌ MongoDB connection failed', error);
    process.exit(1);
  }
};

/* ------------------------------------------------------------------
   Health Check
------------------------------------------------------------------ */
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
      status: states[state] || 'unknown',
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

export { connectDB, checkDatabaseHealth };
