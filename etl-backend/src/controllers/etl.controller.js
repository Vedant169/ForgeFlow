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

/**
 * Computes dynamic dataset analytics, field categorization, and aggregated chart data.
 * GET /api/etl/history/:id/analytics
 */
const getPipelineAnalytics = asyncWrap(async (req, res) => {
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

  const rows = Array.isArray(record.data) ? record.data : [];
  if (rows.length === 0) {
    return res.status(200).json({
      success: true,
      pipelineId: record._id,
      sourceUrl: record.sourceUrl,
      rowCount: 0,
      fields: { all: [], numeric: [], categorical: [], temporal: [] },
      config: { xAxis: '', yAxis: [], chartType: 'bar', aggregation: 'sum' },
      chartData: [],
      summary: { totalRecords: 0, plottedPoints: 0, numericCount: 0, categoricalCount: 0, temporalCount: 0 }
    });
  }

  // 1. Determine field metadata
  let fieldProfiles = record.metadata?.fieldProfiles;
  if (!Array.isArray(fieldProfiles) || fieldProfiles.length === 0) {
    const inferred = inferTypes(rows);
    fieldProfiles = inferred.fieldProfiles;
  }

  const numericFields = fieldProfiles.filter(p => p.type === 'numeric').map(p => p.field);
  const temporalFields = fieldProfiles.filter(p => p.type === 'temporal').map(p => p.field);
  const categoricalFields = fieldProfiles.filter(p => p.type === 'categorical').map(p => p.field);
  const allFields = fieldProfiles.map(p => p.field);

  // 2. Parse query parameters
  let { xAxis, yAxis, chartType, aggregation, limit } = req.query;

  // Resolve X-Axis
  let selectedX = xAxis && allFields.includes(xAxis) ? xAxis : null;
  if (!selectedX) {
    selectedX = categoricalFields[0] || temporalFields[0] || allFields[0] || '';
  }

  // Resolve Y-Axis (supports multiple comma-separated series)
  let requestedYList = [];
  if (yAxis) {
    requestedYList = String(yAxis).split(',').map(s => s.trim()).filter(Boolean);
  }
  let selectedYList = requestedYList.filter(f => numericFields.includes(f));
  if (selectedYList.length === 0) {
    selectedYList = numericFields.slice(0, 1);
  }

  // Check field classifications
  const isXTemporal = temporalFields.includes(selectedX);
  const isXNumeric = numericFields.includes(selectedX);
  const isXCategorical = categoricalFields.includes(selectedX) || (!isXTemporal && !isXNumeric);

  // Resolve Chart Type
  let selectedChartType = chartType ? chartType.toLowerCase() : null;
  const validChartTypes = ['bar', 'line', 'area', 'scatter', 'pie'];
  if (!validChartTypes.includes(selectedChartType)) {
    if (isXTemporal) selectedChartType = 'line';
    else if (isXNumeric) selectedChartType = 'scatter';
    else selectedChartType = 'bar';
  }

  // Resolve Aggregation
  let selectedAggregation = aggregation ? aggregation.toLowerCase() : 'sum';
  if (!['sum', 'avg', 'count', 'min', 'max'].includes(selectedAggregation)) {
    selectedAggregation = 'sum';
  }

  const maxPoints = Math.min(Math.max(parseInt(limit, 10) || 50, 10), 200);

  // 3. Aggregate / Process Chart Data
  let processedChartData = [];

  if (selectedChartType === 'scatter') {
    const yField = selectedYList[0] || numericFields[0];
    const xField = selectedX;

    processedChartData = rows
      .map((row, idx) => {
        const rawX = row[xField];
        const rawY = row[yField];
        const numX = Number(rawX);
        const numY = Number(rawY);
        if (isNaN(numX) || isNaN(numY) || rawX === null || rawY === null) return null;
        return {
          [xField]: numX,
          [yField]: numY,
          _label: row.title || row.name || row.id || `Item ${idx + 1}`
        };
      })
      .filter(Boolean)
      .slice(0, maxPoints * 2);

  } else if (isXTemporal && (selectedChartType === 'line' || selectedChartType === 'area')) {
    const timeMap = new Map();

    rows.forEach(row => {
      const rawTime = row[selectedX];
      if (rawTime === null || rawTime === undefined || rawTime === '') return;
      const key = String(rawTime);

      if (!timeMap.has(key)) {
        const initial = { count: 0 };
        selectedYList.forEach(yF => {
          initial[`${yF}_sum`] = 0;
          initial[`${yF}_count`] = 0;
          initial[`${yF}_min`] = Infinity;
          initial[`${yF}_max`] = -Infinity;
        });
        timeMap.set(key, initial);
      }

      const entry = timeMap.get(key);
      entry.count += 1;
      selectedYList.forEach(yF => {
        const val = Number(row[yF]);
        if (!isNaN(val)) {
          entry[`${yF}_sum`] += val;
          entry[`${yF}_count`] += 1;
          entry[`${yF}_min`] = Math.min(entry[`${yF}_min`], val);
          entry[`${yF}_max`] = Math.max(entry[`${yF}_max`], val);
        }
      });
    });

    processedChartData = Array.from(timeMap.entries()).map(([key, stats]) => {
      const item = { [selectedX]: key };
      selectedYList.forEach(yF => {
        const cnt = stats[`${yF}_count`];
        const sum = stats[`${yF}_sum`];
        if (cnt === 0) {
          item[yF] = 0;
        } else if (selectedAggregation === 'avg') {
          item[yF] = Math.round((sum / cnt) * 100) / 100;
        } else if (selectedAggregation === 'min') {
          item[yF] = stats[`${yF}_min`] === Infinity ? 0 : stats[`${yF}_min`];
        } else if (selectedAggregation === 'max') {
          item[yF] = stats[`${yF}_max`] === -Infinity ? 0 : stats[`${yF}_max`];
        } else if (selectedAggregation === 'count') {
          item[yF] = cnt;
        } else {
          item[yF] = Math.round(sum * 100) / 100;
        }
      });
      return item;
    });

    processedChartData.sort((a, b) => {
      const tA = new Date(a[selectedX]).getTime();
      const tB = new Date(b[selectedX]).getTime();
      if (!isNaN(tA) && !isNaN(tB)) return tA - tB;
      return String(a[selectedX]).localeCompare(String(b[selectedX]));
    });

    if (processedChartData.length > maxPoints) {
      const step = Math.ceil(processedChartData.length / maxPoints);
      processedChartData = processedChartData.filter((_, idx) => idx % step === 0);
    }

  } else {
    // Categorical grouping
    const groups = new Map();

    rows.forEach(row => {
      const rawVal = row[selectedX];
      const key = (rawVal === null || rawVal === undefined || rawVal === '') 
        ? '(blank)' 
        : String(rawVal).length > 25 ? String(rawVal).substring(0, 25) + '…' : String(rawVal);

      if (!groups.has(key)) {
        const initial = { count: 0 };
        selectedYList.forEach(yF => {
          initial[`${yF}_sum`] = 0;
          initial[`${yF}_count`] = 0;
          initial[`${yF}_min`] = Infinity;
          initial[`${yF}_max`] = -Infinity;
        });
        groups.set(key, initial);
      }

      const group = groups.get(key);
      group.count += 1;
      selectedYList.forEach(yF => {
        const val = Number(row[yF]);
        if (!isNaN(val)) {
          group[`${yF}_sum`] += val;
          group[`${yF}_count`] += 1;
          group[`${yF}_min`] = Math.min(group[`${yF}_min`], val);
          group[`${yF}_max`] = Math.max(group[`${yF}_max`], val);
        }
      });
    });

    processedChartData = Array.from(groups.entries()).map(([key, stats]) => {
      const item = { [selectedX]: key };
      selectedYList.forEach(yF => {
        const cnt = stats[`${yF}_count`];
        const sum = stats[`${yF}_sum`];
        if (selectedAggregation === 'count') {
          item[yF] = stats.count;
        } else if (cnt === 0) {
          item[yF] = 0;
        } else if (selectedAggregation === 'avg') {
          item[yF] = Math.round((sum / cnt) * 100) / 100;
        } else if (selectedAggregation === 'min') {
          item[yF] = stats[`${yF}_min`] === Infinity ? 0 : stats[`${yF}_min`];
        } else if (selectedAggregation === 'max') {
          item[yF] = stats[`${yF}_max`] === -Infinity ? 0 : stats[`${yF}_max`];
        } else {
          item[yF] = Math.round(sum * 100) / 100;
        }
      });
      return item;
    });

    if (selectedChartType === 'pie') {
      const primaryY = selectedYList[0];
      if (primaryY) {
        processedChartData.sort((a, b) => (b[primaryY] || 0) - (a[primaryY] || 0));
        if (processedChartData.length > 8) {
          const top = processedChartData.slice(0, 7);
          const otherSum = processedChartData.slice(7).reduce((acc, curr) => acc + (curr[primaryY] || 0), 0);
          top.push({
            [selectedX]: 'Other',
            [primaryY]: Math.round(otherSum * 100) / 100
          });
          processedChartData = top;
        }
      }
    } else {
      const primaryY = selectedYList[0];
      if (primaryY) {
        processedChartData.sort((a, b) => (b[primaryY] || 0) - (a[primaryY] || 0));
      }
      processedChartData = processedChartData.slice(0, maxPoints);
    }
  }

  return res.status(200).json({
    success: true,
    pipelineId: record._id,
    sourceUrl: record.sourceUrl,
    httpMethod: record.httpMethod,
    runAt: record.runAt,
    rowCount: record.rowCount || rows.length,
    fields: {
      all: allFields,
      numeric: numericFields,
      categorical: categoricalFields,
      temporal: temporalFields
    },
    config: {
      xAxis: selectedX,
      yAxis: selectedYList,
      chartType: selectedChartType,
      aggregation: selectedAggregation
    },
    chartData: processedChartData,
    summary: {
      totalRecords: rows.length,
      plottedPoints: processedChartData.length,
      numericCount: numericFields.length,
      categoricalCount: categoricalFields.length,
      temporalCount: temporalFields.length
    }
  });
});

module.exports = { runPipeline, getPipelineHistory, getPipelineRecordById, getPipelineAnalytics };
