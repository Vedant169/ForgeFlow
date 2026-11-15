'use strict';

/**
 * extract.service.js
 *
 * Responsible for the **Extract** phase of the ETL pipeline.
 *
 * Design goals:
 *  - Stream-based consumption: reads the HTTP response in sequential 64 KB
 *    chunks so that the Node.js heap is never burdened with the full payload
 *    at once — safe for payloads well beyond 50 MB.
 *  - Supports GET and POST methods, custom request headers, and bearer-token
 *    injection.
 *  - Uses only Node.js built-in `https`/`http` modules plus the WHATWG `URL`
 *    class — zero additional dependencies.
 *  - Returns the fully assembled JSON-parsed body once streaming is complete.
 */

const http  = require('http');
const https = require('https');

const CHUNK_SIZE = 64 * 1024; // 64 KB read target (informational; Node streams auto-chunk)

/**
 * Fetches and parses JSON from a remote REST endpoint using streaming.
 *
 * @param {object}  options
 * @param {string}  options.url           - Fully-qualified target URL.
 * @param {string}  [options.method]      - HTTP verb, defaults to 'GET'.
 * @param {object}  [options.headers]     - Custom headers to merge into the request.
 * @param {string}  [options.bearerToken] - If provided, sets Authorization: Bearer <token>.
 * @param {object}  [options.body]        - Request body for POST (will be JSON-serialised).
 * @param {number}  [options.timeoutMs]   - Request timeout in ms (default 30 000).
 * @returns {Promise<any>}                  Parsed JSON payload.
 */
const extractData = (options = {}) =>
  new Promise((resolve, reject) => {
    const {
      url,
      method      = 'GET',
      headers     = {},
      bearerToken = null,
      body        = null,
      timeoutMs   = 30_000,
    } = options;

    if (!url) {
      return reject(new Error('[extract] "url" is required'));
    }

    // ── Build request options ────────────────────────────────────────────────
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch {
      return reject(new Error(`[extract] Invalid URL: "${url}"`));
    }

    const isHttps   = parsedUrl.protocol === 'https:';
    const transport = isHttps ? https : http;

    const serialisedBody =
      body && method.toUpperCase() === 'POST'
        ? JSON.stringify(body)
        : null;

    const requestHeaders = {
      Accept: 'application/json',
      'User-Agent': 'ETL-Pipeline/1.0',
      ...(serialisedBody
        ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(serialisedBody) }
        : {}),
      ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      ...headers,
    };

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port:     parsedUrl.port || (isHttps ? 443 : 80),
      path:     parsedUrl.pathname + parsedUrl.search,
      method:   method.toUpperCase(),
      headers:  requestHeaders,
    };

    // ── Execute request ──────────────────────────────────────────────────────
    const req = transport.request(reqOptions, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume(); // Drain to free the socket
        return reject(
          new Error(
            `[extract] HTTP ${res.statusCode} from ${url}`
          )
        );
      }

      // ── Stream assembly in 64 KB chunks ───────────────────────────────────
      const chunks = [];
      let   totalBytes = 0;

      res.on('data', (chunk) => {
        chunks.push(chunk);
        totalBytes += chunk.length;

        // Log progress every ~1 MB for large payloads
        if (totalBytes % (1024 * 1024) < CHUNK_SIZE) {
          console.log(
            `[extract] Received ${(totalBytes / 1024 / 1024).toFixed(2)} MB …`
          );
        }
      });

      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        try {
          const parsed = JSON.parse(raw);
          console.log(
            `[extract] Done — ${(totalBytes / 1024).toFixed(1)} KB received from ${url}`
          );
          resolve(parsed);
        } catch (parseErr) {
          reject(
            new Error(
              `[extract] JSON parse error: ${parseErr.message}. ` +
                `First 200 chars: ${raw.slice(0, 200)}`
            )
          );
        }
      });

      res.on('error', (err) =>
        reject(new Error(`[extract] Stream error: ${err.message}`))
      );
    });

    // ── Timeout ───────────────────────────────────────────────────────────────
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`[extract] Request to ${url} timed out after ${timeoutMs} ms`));
    });

    req.on('error', (err) =>
      reject(new Error(`[extract] Request error: ${err.message}`))
    );

    // ── Send body for POST ────────────────────────────────────────────────────
    if (serialisedBody) req.write(serialisedBody);

    req.end();
  });

module.exports = { extractData };
