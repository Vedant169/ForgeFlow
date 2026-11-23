'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_automated_testing_purposes_only_32_chars';

const PipelineRecord = require('../src/models/PipelineRecord');
const {
  getPipelineRecordById,
  getPipelineHistory,
  getPipelineAnalytics,
} = require('../src/controllers/etl.controller');

// Helper to create mock Express response
const createMockRes = () => {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return res;
};

describe('Pipeline Ownership & Data Isolation Suite', () => {
  const userA_Id = new mongoose.Types.ObjectId();
  const userB_Id = new mongoose.Types.ObjectId();
  const recordId = new mongoose.Types.ObjectId();

  const sampleRecordOwnedByA = {
    _id: recordId,
    sourceUrl: 'https://api.example.com/data',
    httpMethod: 'GET',
    rowCount: 2,
    owner: userA_Id,
    data: [
      { id: 1, name: 'Item 1', score: 100 },
      { id: 2, name: 'Item 2', score: 200 },
    ],
    metadata: {
      fieldProfiles: [
        { field: 'id', type: 'numeric' },
        { field: 'name', type: 'categorical' },
        { field: 'score', type: 'numeric' },
      ],
    },
  };

  it('should block User B from accessing User A’s pipeline record (Test 11)', async () => {
    // Mock mongoose connection as ready
    const originalReadyState = mongoose.connection.readyState;
    const originalFindById = PipelineRecord.findById;

    mongoose.connection.readyState = 1;
    PipelineRecord.findById = () => ({
      lean: async () => sampleRecordOwnedByA,
    });

    try {
      const req = {
        params: { id: recordId.toString() },
        user: { _id: userB_Id, role: 'developer' }, // User B attempts to access User A's record
      };
      const res = createMockRes();

      await getPipelineRecordById(req, res);

      // Ownership enforcement: returns 404 to avoid leaking record existence
      assert.equal(res.statusCode, 404);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /not found/i);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      PipelineRecord.findById = originalFindById;
    }
  });

  it('should allow User A to access their own pipeline record (Test 12)', async () => {
    const originalReadyState = mongoose.connection.readyState;
    const originalFindById = PipelineRecord.findById;

    mongoose.connection.readyState = 1;
    PipelineRecord.findById = () => ({
      lean: async () => sampleRecordOwnedByA,
    });

    try {
      const req = {
        params: { id: recordId.toString() },
        user: { _id: userA_Id, role: 'developer' }, // User A accesses their own record
      };
      const res = createMockRes();

      await getPipelineRecordById(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.record._id.toString(), recordId.toString());
      assert.equal(res.body.record.owner.toString(), userA_Id.toString());
    } finally {
      mongoose.connection.readyState = originalReadyState;
      PipelineRecord.findById = originalFindById;
    }
  });

  it('should allow Admin to access any pipeline record for system auditing', async () => {
    const originalReadyState = mongoose.connection.readyState;
    const originalFindById = PipelineRecord.findById;

    mongoose.connection.readyState = 1;
    PipelineRecord.findById = () => ({
      lean: async () => sampleRecordOwnedByA,
    });

    try {
      const req = {
        params: { id: recordId.toString() },
        user: { _id: userB_Id, role: 'admin' }, // Admin accesses record
      };
      const res = createMockRes();

      await getPipelineRecordById(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.record._id.toString(), recordId.toString());
    } finally {
      mongoose.connection.readyState = originalReadyState;
      PipelineRecord.findById = originalFindById;
    }
  });

  it('should filter pipeline history strictly by the authenticated user’s ID (Test 13)', async () => {
    const originalReadyState = mongoose.connection.readyState;
    const originalFind = PipelineRecord.find;
    const originalCount = PipelineRecord.countDocuments;

    mongoose.connection.readyState = 1;
    let queryFilterCaptured = null;

    PipelineRecord.find = (filter) => {
      queryFilterCaptured = filter;
      return {
        sort: () => ({
          skip: () => ({
            limit: () => ({
              lean: async () => [sampleRecordOwnedByA],
            }),
          }),
        }),
      };
    };

    PipelineRecord.countDocuments = async (filter) => 1;

    try {
      const req = {
        query: { limit: '10', page: '1' },
        user: { _id: userA_Id, role: 'developer' },
      };
      const res = createMockRes();

      await getPipelineHistory(req, res);

      assert.equal(res.statusCode, 200);
      assert.ok(queryFilterCaptured);
      // Verify query is strictly filtered by the authenticated user ID
      assert.equal(queryFilterCaptured.owner.toString(), userA_Id.toString());
    } finally {
      mongoose.connection.readyState = originalReadyState;
      PipelineRecord.find = originalFind;
      PipelineRecord.countDocuments = originalCount;
    }
  });

  it('should prevent User B from accessing User A’s dataset analytics', async () => {
    const originalReadyState = mongoose.connection.readyState;
    const originalFindById = PipelineRecord.findById;

    mongoose.connection.readyState = 1;
    PipelineRecord.findById = () => ({
      lean: async () => sampleRecordOwnedByA,
    });

    try {
      const req = {
        params: { id: recordId.toString() },
        query: {},
        user: { _id: userB_Id, role: 'developer' },
      };
      const res = createMockRes();

      await getPipelineAnalytics(req, res);

      assert.equal(res.statusCode, 404);
      assert.equal(res.body.success, false);
    } finally {
      mongoose.connection.readyState = originalReadyState;
      PipelineRecord.findById = originalFindById;
    }
  });
});
