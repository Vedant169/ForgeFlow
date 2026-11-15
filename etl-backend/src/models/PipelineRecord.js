'use strict';

const mongoose = require('mongoose');

/**
 * PipelineRecord — schema-agnostic document persisted after a successful
 * ETL run. `strict: false` allows Mongoose to store any shape of flattened
 * rows and metadata without requiring schema migrations.
 *
 * Top-level fields carry pipeline provenance; the arbitrary ETL payload
 * lives under `data` and `metadata`.
 */
const PipelineRecordSchema = new mongoose.Schema(
  {
    /** Originating URL that was extracted */
    sourceUrl: {
      type:     String,
      required: true,
      trim:     true,
    },

    /** HTTP method used for extraction */
    httpMethod: {
      type:    String,
      enum:    ['GET', 'POST'],
      default: 'GET',
    },

    /** ISO-8601 timestamp of when the pipeline was triggered */
    runAt: {
      type:    Date,
      default: () => new Date(),
      index:   true,
    },

    /** Total number of flattened rows produced by the transform step */
    rowCount: {
      type: Number,
      min:  0,
    },

    /**
     * Field-level type metadata produced by the type-inference engine.
     * Shape: { fieldName: { type, sampleValues, uniqueCount, nullCount } }
     */
    metadata: {
      type:    mongoose.Schema.Types.Mixed,
      default: {},
    },

    /**
     * Flattened, transformed rows.
     * Stored as Mixed to accommodate arbitrary dynamic schemas.
     */
    data: {
      type:    [mongoose.Schema.Types.Mixed],
      default: [],
    },

    /** Pipeline execution time in milliseconds */
    durationMs: {
      type: Number,
      min:  0,
    },
  },
  {
    // Allow any extra keys to be stored without schema enforcement
    strict:     false,
    timestamps: true,        // adds createdAt / updatedAt
    collection: 'pipeline_records',
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
PipelineRecordSchema.index({ sourceUrl: 1, runAt: -1 });

module.exports = mongoose.model('PipelineRecord', PipelineRecordSchema);
