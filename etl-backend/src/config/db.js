'use strict';

const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB with connection pooling.
 * Emits lifecycle events to stdout for observability.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    const errorMsg = '[db] MONGO_URI environment variable is missing.';
    if (process.env.NODE_ENV === 'production') {
      console.error(errorMsg);
      process.exit(1);
    } else {
      console.warn(`${errorMsg} Persistence features will be unavailable.`);
      return null;
    }
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS:          45_000,
      maxPoolSize:              10,
    });

    console.log(`[db] MongoDB connected successfully: ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () =>
      console.warn('[db] MongoDB disconnected')
    );
    mongoose.connection.on('reconnected', () =>
      console.log('[db] MongoDB reconnected')
    );
    mongoose.connection.on('error', (err) =>
      console.error('[db] MongoDB connection error:', err.message)
    );

    return conn;
  } catch (err) {
    console.error('[db] Initial database connection failed:', err.message);
    if (process.env.NODE_ENV === 'production') {
      console.error('[db] Fatal: Database connection is required in production. Exiting.');
      process.exit(1);
    }
    return null;
  }
};

/**
 * Gracefully closes Mongoose connection.
 */
const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
    console.log('[db] MongoDB connection closed.');
  }
};

/**
 * Returns boolean readiness of MongoDB connection.
 */
const isDBConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, closeDB, isDBConnected };
