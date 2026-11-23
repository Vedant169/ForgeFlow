'use strict';

const mongoose = require('mongoose');

/**
 * Establishes a connection to MongoDB Atlas.
 * Uses connection pooling (default pool size = 5).
 * Emits lifecycle events to stdout for observability.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.warn(
      '[db] MONGO_URI is not set — skipping database connection. ' +
        'Persistence features will be unavailable.'
    );
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Recommended for production Atlas clusters
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS:          45_000,
      maxPoolSize:              10,
    });

    console.log(`[db] MongoDB connected: ${conn.connection.host}`);

    // Auto-seed demo account if missing
    try {
      const User = require('../models/User');
      const bcrypt = require('bcrypt');
      const demoEmail = 'vedant.gupta@flowforge.internal';
      const existing = await User.findOne({ email: demoEmail });
      if (!existing) {
        const hashedPassword = await bcrypt.hash('FlowForge2026!', 12);
        await User.create({
          name: 'Vedant Gupta',
          email: demoEmail,
          password: hashedPassword,
          role: 'admin'
        });
        console.log('[db] Seeded default demo user (vedant.gupta@flowforge.internal)');
      }
    } catch (seedErr) {
      console.warn('[db] Demo seed check skipped:', seedErr.message);
    }

    mongoose.connection.on('disconnected', () =>
      console.warn('[db] MongoDB disconnected')
    );
    mongoose.connection.on('reconnected', () =>
      console.log('[db] MongoDB reconnected')
    );
    mongoose.connection.on('error', (err) =>
      console.error('[db] MongoDB error:', err.message)
    );
  } catch (err) {
    console.error('[db] Initial connection failed:', err.message);
    // Do not crash the process — the server can still serve non-DB routes
  }
};

module.exports = connectDB;
