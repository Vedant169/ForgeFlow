'use strict';
const protect = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const { Router } = require('express');
const {
  runPipeline,
  getPipelineHistory,
  getPipelineRecordById,
  getPipelineAnalytics,
} = require('../controllers/etl.controller');

const router = Router();

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
    "/history/:id/analytics",
    protect,
    getPipelineAnalytics
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