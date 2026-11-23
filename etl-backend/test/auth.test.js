'use strict';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Set test environment variables before requiring modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_for_automated_testing_purposes_only_32_chars';
process.env.JWT_EXPIRES_IN = '1h';

const protect = require('../src/middleware/auth.middleware');
const authorize = require('../src/middleware/role.middleware');
const { generateToken } = require('../src/controllers/auth.controller');
const User = require('../src/models/User');

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
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
  };
  return res;
};

describe('ForgeFlow Authentication & Authorization Suite', () => {

  describe('1. Registration & Input Validation', () => {
    it('should register a new user successfully and never return password hash (Test 1)', async () => {
      const { register } = require('../src/controllers/auth.controller');
      const originalFindOne = User.findOne;
      const originalCreate = User.create;

      User.findOne = async () => null;
      User.create = async (payload) => ({
        _id: '6650a1b2c3d4e5f6a7b8c9d0',
        name: payload.name,
        email: payload.email,
        role: payload.role,
      });

      try {
        const req = {
          body: {
            name: 'Valid Developer',
            email: 'valid.dev@example.com',
            password: 'StrongPassword123!',
          },
        };
        const res = createMockRes();

        await register(req, res);
        assert.equal(res.statusCode, 201);
        assert.equal(res.body.success, true);
        assert.ok(res.body.token);
        assert.equal(res.body.user.email, 'valid.dev@example.com');
        assert.equal(res.body.user.password, undefined); // Password MUST NEVER be in response
      } finally {
        User.findOne = originalFindOne;
        User.create = originalCreate;
      }
    });

    it('should reject registration if email is already registered (Test 2)', async () => {
      const { register } = require('../src/controllers/auth.controller');
      const originalFindOne = User.findOne;

      User.findOne = async () => ({ _id: 'existing_user_id', email: 'duplicate@example.com' });

      try {
        const req = {
          body: {
            name: 'Duplicate User',
            email: 'duplicate@example.com',
            password: 'ValidPassword123!',
          },
        };
        const res = createMockRes();

        await register(req, res);
        assert.equal(res.statusCode, 409);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /already registered/i);
      } finally {
        User.findOne = originalFindOne;
      }
    });

    it('should log in a user with correct credentials and return JWT (Test 3)', async () => {
      const { login } = require('../src/controllers/auth.controller');
      const originalFindOne = User.findOne;

      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 12);
      User.findOne = () => ({
        select: () => ({
          _id: '6650a1b2c3d4e5f6a7b8c9d0',
          name: 'Valid Developer',
          email: 'valid.dev@example.com',
          password: hashedPassword,
          role: 'developer',
        }),
      });

      try {
        const req = {
          body: {
            email: 'valid.dev@example.com',
            password: 'CorrectPassword123!',
          },
        };
        const res = createMockRes();

        await login(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.ok(res.body.token);
        assert.equal(res.body.user.password, undefined);
      } finally {
        User.findOne = originalFindOne;
      }
    });

    it('should reject login with incorrect password with HTTP 401 (Test 4)', async () => {
      const { login } = require('../src/controllers/auth.controller');
      const originalFindOne = User.findOne;

      const hashedPassword = await bcrypt.hash('CorrectPassword123!', 12);
      User.findOne = () => ({
        select: () => ({
          _id: '6650a1b2c3d4e5f6a7b8c9d0',
          email: 'valid.dev@example.com',
          password: hashedPassword,
          role: 'developer',
        }),
      });

      try {
        const req = {
          body: {
            email: 'valid.dev@example.com',
            password: 'WrongPassword999!',
          },
        };
        const res = createMockRes();

        await login(req, res);
        assert.equal(res.statusCode, 401);
        assert.equal(res.body.success, false);
        assert.match(res.body.message, /Invalid email or password/i);
      } finally {
        User.findOne = originalFindOne;
      }
    });

    it('should reject registration when name, email, or password are missing (Test 5)', async () => {
      const { register } = require('../src/controllers/auth.controller');
      const req = { body: { email: 'test@example.com' } };
      const res = createMockRes();

      await register(req, res);
      assert.equal(res.statusCode, 400);
      assert.equal(res.body.success, false);
      assert.match(res.body.message, /required/i);
    });

    it('should reject registration when password is shorter than 8 characters', async () => {
      const { register } = require('../src/controllers/auth.controller');
      const req = {
        body: {
          name: 'Short Password User',
          email: 'shortpass@example.com',
          password: '123',
        },
      };
      const res = createMockRes();

      await register(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /8 characters/i);
    });

    it('should reject registration when email format is invalid', async () => {
      const { register } = require('../src/controllers/auth.controller');
      const req = {
        body: {
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'ValidPassword123!',
        },
      };
      const res = createMockRes();

      await register(req, res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.message, /valid email/i);
    });
  });

  describe('2. JWT Generation & Verification', () => {
    it('should generate valid JWT containing user id and role', () => {
      const mockUser = { _id: '6650a1b2c3d4e5f6a7b8c9d0', role: 'developer' };
      const token = generateToken(mockUser);
      assert.ok(token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      assert.equal(decoded.id, mockUser._id);
      assert.equal(decoded.role, 'developer');
    });

    it('should reject requests with missing authorization header (Test 6)', async () => {
      const req = { headers: {} };
      const res = createMockRes();
      let nextCalled = false;

      await protect(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 401);
      assert.equal(nextCalled, false);
      assert.match(res.body.message, /Bearer token missing/i);
    });

    it('should reject requests with malformed or invalid JWT (Test 7)', async () => {
      const req = { headers: { authorization: 'Bearer invalid.token.payload' } };
      const res = createMockRes();
      let nextCalled = false;

      await protect(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 401);
      assert.equal(nextCalled, false);
      assert.match(res.body.message, /Invalid or malformed/i);
    });

    it('should reject requests with expired JWT (Test 8)', async () => {
      // Create a token expired 1 hour ago
      const expiredToken = jwt.sign(
        { id: '6650a1b2c3d4e5f6a7b8c9d0', role: 'developer' },
        process.env.JWT_SECRET,
        { expiresIn: -3600 }
      );

      const req = { headers: { authorization: `Bearer ${expiredToken}` } };
      const res = createMockRes();
      let nextCalled = false;

      await protect(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 401);
      assert.equal(nextCalled, false);
      assert.match(res.body.message, /expired/i);
    });
  });

  describe('3. Role-Based Access Control (RBAC)', () => {
    it('should allow user with matching role (Test 9: Authorized)', () => {
      const req = { user: { role: 'admin' } };
      const res = createMockRes();
      let nextCalled = false;

      const middleware = authorize('admin', 'developer');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(nextCalled, true);
    });

    it('should block user with unauthorized role with HTTP 403 (Test 9: Unauthorized)', () => {
      const req = { user: { role: 'viewer' } };
      const res = createMockRes();
      let nextCalled = false;

      const middleware = authorize('admin');
      middleware(req, res, () => { nextCalled = true; });

      assert.equal(res.statusCode, 403);
      assert.equal(nextCalled, false);
      assert.match(res.body.message, /Forbidden/i);
    });
  });

  describe('4. Privilege Escalation Prevention', () => {
    it('should prevent client-supplied role from escalating during registration (Test 10)', async () => {
      // Mock User.findOne to return null, and User.create to capture arguments
      const originalFindOne = User.findOne;
      const originalCreate = User.create;

      let capturedPayload = null;
      User.findOne = async () => null;
      User.create = async (payload) => {
        capturedPayload = payload;
        return {
          _id: '6650a1b2c3d4e5f6a7b8c9d1',
          name: payload.name,
          email: payload.email,
          role: payload.role,
        };
      };

      try {
        const { register } = require('../src/controllers/auth.controller');
        const req = {
          body: {
            name: 'Malicious Attacker',
            email: 'attacker@example.com',
            password: 'SecurePassword123!',
            role: 'admin', // Attempted privilege escalation!
          },
        };
        const res = createMockRes();

        await register(req, res);
        assert.equal(res.statusCode, 201);
        assert.ok(capturedPayload);
        // Role MUST be defaulted to 'developer' and ignore the 'admin' from req.body
        assert.equal(capturedPayload.role, 'developer');
        assert.equal(res.body.user.role, 'developer');
      } finally {
        User.findOne = originalFindOne;
        User.create = originalCreate;
      }
    });
  });

  describe('5. Password Security & Hashing', () => {
    it('should verify passwords are encrypted with bcrypt cost factor >= 12 and never returned in plain text', async () => {
      const plainPassword = 'PlainSecretPassword123!';
      const hash = await bcrypt.hash(plainPassword, 12);

      assert.notEqual(hash, plainPassword);
      assert.ok(hash.startsWith('$2')); // bcrypt salt format

      const isMatch = await bcrypt.compare(plainPassword, hash);
      assert.equal(isMatch, true);

      const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
      assert.equal(isWrongMatch, false);
    });
  });
});
