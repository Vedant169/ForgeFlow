'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const { connectDB, closeDB, isDBConnected } = require('./src/config/db');
const etlRoutes   = require('./src/routes/etl.routes');
const errorHandler = require('./src/utils/errorHandler');
const authRoutes = require('./src/routes/auth.routes');

// ─── Environment & Security Pre-flight Checks ────────────────────────────────
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('[server] Fatal: JWT_SECRET environment variable is missing. Application cannot start in production.');
    process.exit(1);
  } else {
    console.warn('[server] Warning: JWT_SECRET is not set. Using fallback development secret.');
    process.env.JWT_SECRET = 'forgeflow_dev_secret_do_not_use_in_production_32char_minimum';
  }
} else if (
  process.env.NODE_ENV === 'production' &&
  (process.env.JWT_SECRET.length < 32 ||
   process.env.JWT_SECRET === 'secret' ||
   process.env.JWT_SECRET.includes('placeholder'))
) {
  console.error('[server] Fatal: Insecure or placeholder JWT_SECRET detected in production. A strong key (>= 32 chars) is required.');
  process.exit(1);
}

// ─── App bootstrap ────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // In development or for local loopback (localhost / 127.0.0.1), allow all origins
      if (
        !origin ||
        process.env.NODE_ENV !== 'production' ||
        allowedOrigins.includes(origin) ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return cb(null, true);
      }
      cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Authentication Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─── Liveness Probe ──────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'ForgeFlow backend is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── Readiness Probe ─────────────────────────────────────────────────────────
app.get('/ready', (_req, res) => {
  const ready = isDBConnected();
  if (ready) {
    return res.status(200).json({
      status: 'READY',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  }
  return res.status(503).json({
    status: 'NOT_READY',
    database: 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ─── ETL Application Routes ──────────────────────────────────────────────────
app.use('/api/etl', etlRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((_req, res) =>
  res.status(404).json({ success: false, message: 'Route not found' })
);

// ─── Centralised async error handler ─────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
let serverInstance = null;

(async () => {
  await connectDB();
  serverInstance = app.listen(PORT, () => {
    console.log(`[server] ETL backend listening on port ${PORT}`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    console.log(`[server] ${signal} received — shutting down gracefully`);
    if (serverInstance) {
      serverInstance.close(async () => {
        console.log('[server] HTTP server closed');
        await closeDB();
        process.exit(0);
      });
    } else {
      await closeDB();
      process.exit(0);
    }

    // Force-kill after 10 s if connections hang
    setTimeout(() => {
      console.error('[server] Graceful shutdown timed out — forcing exit');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
})();

module.exports = app;
