'use strict';
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { Router } = require('express');
const {
  runPipeline,
  getPipelineHistory,
  getPipelineRecordById,
} = require('../controllers/etl.controller');

const router = Router();

/**
 * @route  POST /api/etl/run
 * @desc   Execute the full ETL pipeline against a remote JSON endpoint.
 * @access Public
 *
 * Body:
 *   url          {string}   required  Target REST endpoint URL.
 *   method       {string}   optional  HTTP method (GET|POST). Default: GET.
 *   headers      {object}   optional  Custom request headers.
 *   bearerToken  {string}   optional  Bearer token for Authorization header.
 *   body         {object}   optional  Request body (POST only).
 *   persist      {boolean}  optional  Persist results to MongoDB. Default: false.
 *   timeoutMs    {number}   optional  Request timeout ms. Default: 30000.
 */
router.post(
    "/run",
    protect,
    runPipeline
);

router.get(
    "/history",
    protect,
    getPipelineHistory
);

router.get(
    "/history/:id",
    protect,
    getPipelineRecordById
);

/**
 * @route  GET /api/etl/history
 * @desc   Retrieve paginated list of past pipeline run records (data excluded).
 * @access Public
 *
 * Query:
 *   limit  {number}  Max records per page (1-100, default 20).
 *   page   {number}  Page number, 1-indexed (default 1).
 */


/**
 * @route  GET /api/etl/history/:id
 * @desc   Retrieve a single pipeline run record by MongoDB ObjectId.
 * @access Public
 */


module.exports = router;