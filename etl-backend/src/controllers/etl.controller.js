'use strict';

const mongoose      = require('mongoose');
const { extractData }  = require('../services/extract.service');
const { transformData } = require('../services/transform.service');
const { inferTypes }    = require('../services/typeInference.service');
const PipelineRecord    = require('../models/PipelineRecord');

/**
 * etl.controller.js
 *
 * Orchestrates the full Extract → Transform → Infer → (optional) Load
 * pipeline and packages the response.
 *
 * POST /api/etl/run
 * ─────────────────
 * Body params:
 *   url          {string}  optional  — Source endpoint URL (required if rawData omitted).
 *   method       {string}  optional  — HTTP verb (GET|POST). Default: GET.
 *   headers      {object}  optional  — Custom request headers.
 *   bearerToken  {string}  optional  — Bearer authentication token.
 *   body         {object}  optional  — POST request body.
 *   rawData      {object}  optional  — Direct raw JSON payload (bypasses network extract).
 *   persist      {boolean} optional  — Whether to save results to MongoDB.
 *   timeoutMs    {number}  optional  — Request timeout in ms (default 30 000).
 *
 * GET /api/etl/history
 * ─────────────────────
 * Query params:
 *   limit  {number}  optional — Max records to return (default 20).
 *   page   {number}  optional — Page number, 1-indexed (default 1).
 *
 * GET /api/etl/history/:id
 * ─────────────────────────
 * Returns a single pipeline run record by its MongoDB ObjectId.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wraps an async controller function so that any thrown error is forwarded
 * to Express's `next()` for centralised error handling.
 * @param {Function} fn
 */
const asyncWrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Controllers ───────────────────────────────────────────────────────────────

/**
 * Runs the complete ETL pipeline.
 */
const runPipeline = asyncWrap(async (req, res) => {
  const {
    url,
    method      = 'GET',
    headers     = {},
    bearerToken = null,
    body        = null,
    rawData: directRawData = null,
    persist     = true,
    timeoutMs   = 30_000,
  } = req.body;

  if (!url && !directRawData) {
    return res.status(400).json({
      success: false,
      message: 'Request body must include a "url" or "rawData" field.',
    });
  }

  const pipelineStart = Date.now();

  // ── 1. Extract ─────────────────────────────────────────────────────────────
  let rawData = directRawData;
  if (!rawData) {
    console.log(`[etl] Starting pipeline for: ${url}`);
    rawData = await extractData({ url, method, headers, bearerToken, body, timeoutMs });
  } else {
    console.log(`[etl] Starting pipeline with pre-supplied payload for: ${url || 'direct-payload'}`);
  }

  // ── 2. Transform ───────────────────────────────────────────────────────────
  const { rows, rowCount } = transformData(rawData);

  // ── 3. Type Inference ──────────────────────────────────────────────────────
  const { fieldProfiles, fieldCount, summary } = inferTypes(rows);

  const durationMs = Date.now() - pipelineStart;

  // ── 4. (Optional) Load to MongoDB ─────────────────────────────────────────
  let savedRecord = null;
  const isConnected = mongoose.connection.readyState === 1;

  if (persist && isConnected) {
    savedRecord = await PipelineRecord.create({
      sourceUrl:  url,
      httpMethod: method.toUpperCase(),
      runAt:      new Date(),
      rowCount,
      metadata:   { fieldProfiles, fieldCount, summary },
      data:       rows,
      durationMs,
    });
    console.log(`[etl] Persisted pipeline record: ${savedRecord._id}`);
  } else if (persist && !isConnected) {
    console.warn('[etl] persist=true but MongoDB is not connected — skipping save');
  }

  // ── 5. Package response ───────────────────────────────────────────────────
  return res.status(200).json({
    success:    true,
    durationMs,
    rowCount,
    fieldCount,
    summary,
    metadata:   fieldProfiles,
    data:       rows,
    ...(savedRecord ? { recordId: savedRecord._id } : {}),
  });
});

/**
 * Returns paginated run history from MongoDB.
 */
const getPipelineHistory = asyncWrap(async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable — history requires a MongoDB connection.',
    });
  }

  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
  const page  = Math.max(parseInt(req.query.page,  10) || 1,  1);
  const skip  = (page - 1) * limit;

  const [records, total] = await Promise.all([
    PipelineRecord
      .find({}, { data: 0 }) // Exclude heavy data array from list view
      .sort({ runAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    PipelineRecord.countDocuments(),
  ]);

  return res.status(200).json({
    success: true,
    total,
    page,
    limit,
    pages:   Math.ceil(total / limit),
    records,
  });
});

/**
 * Returns a single pipeline run record by ID (includes full data).
 */
const getPipelineRecordById = asyncWrap(async (req, res) => {
  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    return res.status(503).json({
      success: false,
      message: 'Database unavailable.',
    });
  }

  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid record ID.' });
  }

  const record = await PipelineRecord.findById(req.params.id).lean();
  if (!record) {
    return res.status(404).json({ success: false, message: 'Record not found.' });
  }

  return res.status(200).json({ success: true, record });
});

module.exports = { runPipeline, getPipelineHistory, getPipelineRecordById };
