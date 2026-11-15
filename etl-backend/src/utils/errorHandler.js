'use strict';

/**
 * errorHandler.js
 *
 * Express 4.x centralised error-handling middleware.
 * Must be registered LAST (after all routes) with exactly four parameters
 * so Express recognises it as an error handler.
 *
 * Behaviour:
 *  - Logs the error stack to stderr.
 *  - Returns a JSON error envelope to the client.
 *  - Hides internal stack traces in production.
 *  - Maps well-known error types to appropriate HTTP status codes.
 */

/**
 * Maps error names / codes to HTTP status codes.
 * @param {Error} err
 * @returns {number}
 */
const resolveStatusCode = (err) => {
  // Explicit status set by calling code
  if (err.statusCode && Number.isInteger(err.statusCode)) return err.statusCode;
  if (err.status     && Number.isInteger(err.status))     return err.status;

  // Mongoose validation error
  if (err.name === 'ValidationError') return 422;

  // Mongoose / MongoDB duplicate-key error
  if (err.code === 11000) return 409;

  // Mongoose cast error (e.g. invalid ObjectId)
  if (err.name === 'CastError') return 400;

  // JSON body parse error from express.json()
  if (err.type === 'entity.parse.failed') return 400;

  // JWT / auth errors surfaced from CORS or bearer validation
  if (err.message && err.message.startsWith('CORS:')) return 403;

  return 500;
};

/**
 * Express error-handling middleware.
 *
 * @param {Error}            err  - The error object.
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next - Required param (do not remove).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  const isProd      = process.env.NODE_ENV === 'production';
  const statusCode  = resolveStatusCode(err);

  // Always log full error on the server
  console.error(
    `[error] ${req.method} ${req.originalUrl} → ${statusCode}`,
    err
  );

  const payload = {
    success:   false,
    message:   err.message || 'An unexpected error occurred.',
    ...(isProd
      ? {}
      : { stack: err.stack }), // Expose stack trace only in development
  };

  // Mongoose validation details
  if (err.name === 'ValidationError' && err.errors) {
    payload.validationErrors = Object.values(err.errors).map((e) => ({
      field:   e.path,
      message: e.message,
    }));
  }

  return res.status(statusCode).json(payload);
};

module.exports = errorHandler;
