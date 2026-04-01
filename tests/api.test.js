'use strict';

require('dotenv').config();
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const supertest = require('supertest');
const app = require('../src/app');

const api = supertest(app);

const ctx = {
  adminToken: null,
  analystToken: null,
  viewerToken: null,
  createdUserId: null,
  createdRecordId: null,
};

const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

// concurrency:false on every describe forces tests to run sequentially
// This is required because:
//   1. Node's test runner runs sibling tests concurrently by default
//   2. ctx (shared state) is mutated between tests (createdRecordId etc.)
//   3. Duplicate-email tests need the first insert to fully commit before the second

describe('Finance API', { concurrency: false }, () => {

  before(async () => {
    const [adminRes, analystRes, viewerRes] = await Promise.all([
      api.post('/api/v1/auth/login').send({ email: 'admin@finance.local',   password: 'password123' }),
      api.post('/api/v1/auth/login').send({ email: 'analyst@finance.local', password: 'password123' }),
      api.post('/api/v1/auth/login').send({ email: 'viewer@finance.local',  password: 'password123' }),
    ]);

    assert.equal(adminRes.status,   200, `Admin login failed: ${JSON.stringify(adminRes.body)}`);
    assert.equal(analystRes.status, 200, `Analyst login failed: ${JSON.stringify(analystRes.body)}`);
    assert.equal(viewerRes.status,  200, `Viewer login failed: ${JSON.stringify(viewerRes.body)}`);

    ctx.adminToken   = adminRes.body.data.token;
    ctx.analystToken = analystRes.body.data.token;
    ctx.viewerToken  = viewerRes.body.data.token;
  });

  // ── AUTH ──────────────────────────────────────────────────────────────────
  describe('Auth', { concurrency: false }, () => {
    test('POST /auth/register — creates a new VIEWER user', async () => {
      const res = await api.post('/api/v1/auth/register').send({
        name: 'Test Register',
        email: `reg_${Date.now()}@test.com`,
        password: 'password123',
      });
      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.role, 'VIEWER');
    });

    test('POST /auth/register — 409 on duplicate email', async () => {
      const email = `dup_${Date.now()}@test.com`;
      // These MUST be sequential — await first before sending second
      const first = await api.post('/api/v1/auth/register').send({ name: 'A', email, password: 'password123' });
      assert.equal(first.status, 201, `First register failed: ${JSON.stringify(first.body)}`);
      const second = await api.post('/api/v1/auth/register').send({ name: 'B', email, password: 'password123' });
      assert.equal(second.status, 409);
      assert.equal(second.body.success, false);
    });

    test('POST /auth/register — 400 on missing fields', async () => {
      const res = await api.post('/api/v1/auth/register').send({ email: 'nope@test.com' });
      assert.equal(res.status, 400);
      assert.ok(Array.isArray(res.body.errors));
    });

    test('POST /auth/login — returns token for valid credentials', async () => {
      const res = await api.post('/api/v1/auth/login').send({
        email: 'admin@finance.local',
        password: 'password123',
      });
      assert.equal(res.status, 200);
      assert.ok(res.body.data.token);
      assert.equal(res.body.data.user.role, 'ADMIN');
    });

    test('POST /auth/login — 401 on wrong password', async () => {
      const res = await api.post('/api/v1/auth/login').send({
        email: 'admin@finance.local',
        password: 'wrongpassword',
      });
      assert.equal(res.status, 401);
    });

    test('POST /auth/login — 401 on unknown email', async () => {
      const res = await api.post('/api/v1/auth/login').send({
        email: 'nobody@nowhere.com',
        password: 'password123',
      });
      assert.equal(res.status, 401);
    });

    test('POST /auth/login — 400 on missing body', async () => {
      const res = await api.post('/api/v1/auth/login').send({});
      assert.equal(res.status, 400);
    });
  });

  // ── USERS ─────────────────────────────────────────────────────────────────
  describe('Users', { concurrency: false }, () => {
    test('GET /users — admin can list users', async () => {
      const res = await api.get('/api/v1/users').set(authHeader(ctx.adminToken));
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length >= 3);
    });

    test('GET /users — 403 for analyst', async () => {
      const res = await api.get('/api/v1/users').set(authHeader(ctx.analystToken));
      assert.equal(res.status, 403);
    });

    test('GET /users — 403 for viewer', async () => {
      const res = await api.get('/api/v1/users').set(authHeader(ctx.viewerToken));
      assert.equal(res.status, 403);
    });

    test('GET /users — 401 without token', async () => {
      const res = await api.get('/api/v1/users');
      assert.equal(res.status, 401);
    });

    test('POST /users — admin creates an analyst user', async () => {
      const res = await api
        .post('/api/v1/users')
        .set(authHeader(ctx.adminToken))
        .send({
          name: 'New Analyst',
          email: `analyst_${Date.now()}@test.com`,
          password: 'password123',
          role: 'ANALYST',
        });
      assert.equal(res.status, 201);
      assert.equal(res.body.data.role, 'ANALYST');
      ctx.createdUserId = res.body.data.id;
    });

    test('POST /users — 409 on duplicate email', async () => {
      const email = `dup_user_${Date.now()}@test.com`;
      const first = await api.post('/api/v1/users').set(authHeader(ctx.adminToken))
        .send({ name: 'X', email, password: 'password123', role: 'VIEWER' });
      assert.equal(first.status, 201, `First user create failed: ${JSON.stringify(first.body)}`);
      const second = await api.post('/api/v1/users').set(authHeader(ctx.adminToken))
        .send({ name: 'Y', email, password: 'password123', role: 'VIEWER' });
      assert.equal(second.status, 409);
    });

    test('POST /users — 400 on invalid role', async () => {
      const res = await api
        .post('/api/v1/users')
        .set(authHeader(ctx.adminToken))
        .send({ name: 'X', email: `x_${Date.now()}@test.com`, password: 'pass123', role: 'SUPERADMIN' });
      assert.equal(res.status, 400);
    });

    test('POST /users — 403 for non-admin', async () => {
      const res = await api
        .post('/api/v1/users')
        .set(authHeader(ctx.analystToken))
        .send({ name: 'X', email: `x2_${Date.now()}@test.com`, password: 'pass123', role: 'VIEWER' });
      assert.equal(res.status, 403);
    });

    test('GET /users/:id — admin can get user by id', async () => {
      const res = await api.get(`/api/v1/users/${ctx.createdUserId}`).set(authHeader(ctx.adminToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.data.id, ctx.createdUserId);
    });

    test('GET /users/:id — 404 on unknown id', async () => {
      const res = await api.get('/api/v1/users/nonexistentid123').set(authHeader(ctx.adminToken));
      assert.equal(res.status, 404);
    });

    test('PATCH /users/:id — admin updates user role', async () => {
      const res = await api
        .patch(`/api/v1/users/${ctx.createdUserId}`)
        .set(authHeader(ctx.adminToken))
        .send({ role: 'VIEWER' });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.role, 'VIEWER');
    });

    test('PATCH /users/:id — 400 on empty body', async () => {
      const res = await api
        .patch(`/api/v1/users/${ctx.createdUserId}`)
        .set(authHeader(ctx.adminToken))
        .send({});
      assert.equal(res.status, 400);
    });

    test('PATCH /users/:id/status — admin deactivates user', async () => {
      const res = await api
        .patch(`/api/v1/users/${ctx.createdUserId}/status`)
        .set(authHeader(ctx.adminToken))
        .send({ status: 'INACTIVE' });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, 'INACTIVE');
    });

    test('PATCH /users/:id/status — admin reactivates user', async () => {
      const res = await api
        .patch(`/api/v1/users/${ctx.createdUserId}/status`)
        .set(authHeader(ctx.adminToken))
        .send({ status: 'ACTIVE' });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.status, 'ACTIVE');
    });

    test('PATCH /users/:id/status — 400 on invalid status value', async () => {
      const res = await api
        .patch(`/api/v1/users/${ctx.createdUserId}/status`)
        .set(authHeader(ctx.adminToken))
        .send({ status: 'BANNED' });
      assert.equal(res.status, 400);
    });
  });

  // ── RECORDS ───────────────────────────────────────────────────────────────
  describe('Records', { concurrency: false }, () => {
    test('POST /records — admin creates a record', async () => {
      const res = await api
        .post('/api/v1/records')
        .set(authHeader(ctx.adminToken))
        .send({
          amount: 75000,
          type: 'INCOME',
          category: 'Salary',
          date: '2024-07-01',
          note: 'Test salary entry',
        });
      assert.equal(res.status, 201, `Create record failed: ${JSON.stringify(res.body)}`);
      assert.equal(res.body.data.category, 'Salary');
      assert.equal(typeof res.body.data.amount, 'number');
      ctx.createdRecordId = res.body.data.id;
    });

    test('POST /records — 403 for analyst', async () => {
      const res = await api
        .post('/api/v1/records')
        .set(authHeader(ctx.analystToken))
        .send({ amount: 100, type: 'EXPENSE', category: 'Food', date: '2024-07-01' });
      assert.equal(res.status, 403);
    });

    test('POST /records — 403 for viewer', async () => {
      const res = await api
        .post('/api/v1/records')
        .set(authHeader(ctx.viewerToken))
        .send({ amount: 100, type: 'EXPENSE', category: 'Food', date: '2024-07-01' });
      assert.equal(res.status, 403);
    });

    test('POST /records — 400 on negative amount', async () => {
      const res = await api
        .post('/api/v1/records')
        .set(authHeader(ctx.adminToken))
        .send({ amount: -500, type: 'EXPENSE', category: 'Food', date: '2024-07-01' });
      assert.equal(res.status, 400);
    });

    test('POST /records — 400 on invalid type', async () => {
      const res = await api
        .post('/api/v1/records')
        .set(authHeader(ctx.adminToken))
        .send({ amount: 500, type: 'TRANSFER', category: 'Food', date: '2024-07-01' });
      assert.equal(res.status, 400);
    });

    test('POST /records — 400 on missing required fields', async () => {
      const res = await api
        .post('/api/v1/records')
        .set(authHeader(ctx.adminToken))
        .send({ amount: 500 });
      assert.equal(res.status, 400);
    });

    test('GET /records — admin gets paginated list', async () => {
      const res = await api
        .get('/api/v1/records?page=1&limit=5')
        .set(authHeader(ctx.adminToken));
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.meta.totalItems >= 1);
      assert.ok('hasNextPage' in res.body.meta);
      assert.ok('hasPrevPage' in res.body.meta);
    });

    test('GET /records — analyst gets full list with advanced sort', async () => {
      const res = await api
        .get('/api/v1/records?sortBy=amount&order=desc&limit=10')
        .set(authHeader(ctx.analystToken));
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
    });

    test('GET /records — analyst can filter by minAmount and maxAmount', async () => {
      const res = await api
        .get('/api/v1/records?minAmount=10000&maxAmount=90000')
        .set(authHeader(ctx.analystToken));
      assert.equal(res.status, 200);
      for (const r of res.body.data) {
        assert.ok(r.amount >= 10000, `amount ${r.amount} < 10000`);
        assert.ok(r.amount <= 90000, `amount ${r.amount} > 90000`);
      }
    });

    test('GET /records — viewer can filter by type', async () => {
      const res = await api
        .get('/api/v1/records?type=INCOME')
        .set(authHeader(ctx.viewerToken));
      assert.equal(res.status, 200);
      for (const r of res.body.data) {
        assert.equal(r.type, 'INCOME');
      }
    });

    test('GET /records — viewer is capped at 20 results', async () => {
      const res = await api
        .get('/api/v1/records?limit=100')
        .set(authHeader(ctx.viewerToken));
      assert.equal(res.status, 200);
      assert.ok(res.body.meta.limit <= 20);
    });

    test('GET /records — 401 without token', async () => {
      const res = await api.get('/api/v1/records');
      assert.equal(res.status, 401);
    });

    test('GET /records — filter by date range', async () => {
      const res = await api
        .get('/api/v1/records?startDate=2024-01-01&endDate=2024-03-31')
        .set(authHeader(ctx.analystToken));
      assert.equal(res.status, 200);
      for (const r of res.body.data) {
        const d = new Date(r.date);
        assert.ok(d >= new Date('2024-01-01'));
        assert.ok(d <= new Date('2024-03-31T23:59:59'));
      }
    });

    test('GET /records/:id — any role can get a record by id', async () => {
      const res = await api
        .get(`/api/v1/records/${ctx.createdRecordId}`)
        .set(authHeader(ctx.viewerToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.data.id, ctx.createdRecordId);
    });

    test('GET /records/:id — 404 on unknown id', async () => {
      const res = await api
        .get('/api/v1/records/doesnotexist999')
        .set(authHeader(ctx.adminToken));
      assert.equal(res.status, 404);
    });

    test('PATCH /records/:id — admin updates a record', async () => {
      const res = await api
        .patch(`/api/v1/records/${ctx.createdRecordId}`)
        .set(authHeader(ctx.adminToken))
        .send({ note: 'Updated note', amount: 80000 });
      assert.equal(res.status, 200);
      assert.equal(res.body.data.amount, 80000);
    });

    test('PATCH /records/:id — 403 for analyst', async () => {
      const res = await api
        .patch(`/api/v1/records/${ctx.createdRecordId}`)
        .set(authHeader(ctx.analystToken))
        .send({ note: 'Should fail' });
      assert.equal(res.status, 403);
    });

    test('PATCH /records/:id — 400 on invalid update payload', async () => {
      const res = await api
        .patch(`/api/v1/records/${ctx.createdRecordId}`)
        .set(authHeader(ctx.adminToken))
        .send({ amount: -100 });
      assert.equal(res.status, 400);
    });

    test('DELETE /records/:id — 403 for viewer', async () => {
      const create = await api
        .post('/api/v1/records')
        .set(authHeader(ctx.adminToken))
        .send({ amount: 100, type: 'EXPENSE', category: 'Test', date: '2024-08-01' });
      assert.equal(create.status, 201);
      const id = create.body.data.id;

      const res = await api.delete(`/api/v1/records/${id}`).set(authHeader(ctx.viewerToken));
      assert.equal(res.status, 403);

      await api.delete(`/api/v1/records/${id}`).set(authHeader(ctx.adminToken));
    });

    test('DELETE /records/:id — admin soft-deletes a record', async () => {
      const res = await api
        .delete(`/api/v1/records/${ctx.createdRecordId}`)
        .set(authHeader(ctx.adminToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
    });

    test('GET /records/:id — 404 after soft delete', async () => {
      const res = await api
        .get(`/api/v1/records/${ctx.createdRecordId}`)
        .set(authHeader(ctx.adminToken));
      assert.equal(res.status, 404);
    });
  });

  // ── DASHBOARD ─────────────────────────────────────────────────────────────
  describe('Dashboard', { concurrency: false }, () => {
    test('GET /dashboard/summary — viewer can access', async () => {
      const res = await api.get('/api/v1/dashboard/summary').set(authHeader(ctx.viewerToken));
      assert.equal(res.status, 200);
      assert.equal(typeof res.body.data.totalIncome,   'number');
      assert.equal(typeof res.body.data.totalExpenses, 'number');
      assert.equal(typeof res.body.data.netBalance,    'number');
      assert.equal(typeof res.body.data.totalRecords,  'number');
      assert.ok(Array.isArray(res.body.data.recentActivity));
    });

    test('GET /dashboard/summary — analyst can access', async () => {
      const res = await api.get('/api/v1/dashboard/summary').set(authHeader(ctx.analystToken));
      assert.equal(res.status, 200);
    });

    test('GET /dashboard/summary — admin can access', async () => {
      const res = await api.get('/api/v1/dashboard/summary').set(authHeader(ctx.adminToken));
      assert.equal(res.status, 200);
      const { totalIncome, totalExpenses, netBalance } = res.body.data;
      assert.equal(netBalance, totalIncome - totalExpenses);
    });

    test('GET /dashboard/summary — 401 without token', async () => {
      const res = await api.get('/api/v1/dashboard/summary');
      assert.equal(res.status, 401);
    });

    test('GET /dashboard/category-breakdown — analyst can access', async () => {
      const res = await api.get('/api/v1/dashboard/category-breakdown').set(authHeader(ctx.analystToken));
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      if (res.body.data.length > 0) {
        const item = res.body.data[0];
        assert.ok('category' in item);
        assert.ok('income'   in item);
        assert.ok('expense'  in item);
        assert.ok('total'    in item);
      }
    });

    test('GET /dashboard/category-breakdown — admin can access', async () => {
      const res = await api.get('/api/v1/dashboard/category-breakdown').set(authHeader(ctx.adminToken));
      assert.equal(res.status, 200);
    });

    test('GET /dashboard/category-breakdown — 403 for viewer', async () => {
      const res = await api.get('/api/v1/dashboard/category-breakdown').set(authHeader(ctx.viewerToken));
      assert.equal(res.status, 403);
    });

    test('GET /dashboard/monthly-trends — analyst gets trends for 2024', async () => {
      const res = await api.get('/api/v1/dashboard/monthly-trends?year=2024').set(authHeader(ctx.analystToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.data.year, 2024);
      assert.ok(Array.isArray(res.body.data.trends));
      assert.equal(res.body.data.trends.length, 12);
      const jan = res.body.data.trends[0];
      assert.ok('month' in jan && 'income' in jan && 'expense' in jan && 'net' in jan);
    });

    test('GET /dashboard/monthly-trends — defaults to current year', async () => {
      const res = await api.get('/api/v1/dashboard/monthly-trends').set(authHeader(ctx.adminToken));
      assert.equal(res.status, 200);
      assert.equal(res.body.data.year, new Date().getFullYear());
    });

    test('GET /dashboard/monthly-trends — 403 for viewer', async () => {
      const res = await api.get('/api/v1/dashboard/monthly-trends').set(authHeader(ctx.viewerToken));
      assert.equal(res.status, 403);
    });

    test('GET /dashboard/recent-activity — analyst can access', async () => {
      const res = await api.get('/api/v1/dashboard/recent-activity?limit=5').set(authHeader(ctx.analystToken));
      assert.equal(res.status, 200);
      assert.ok(Array.isArray(res.body.data));
      assert.ok(res.body.data.length <= 5);
    });

    test('GET /dashboard/recent-activity — admin can access', async () => {
      const res = await api.get('/api/v1/dashboard/recent-activity').set(authHeader(ctx.adminToken));
      assert.equal(res.status, 200);
    });

    test('GET /dashboard/recent-activity — 403 for viewer', async () => {
      const res = await api.get('/api/v1/dashboard/recent-activity').set(authHeader(ctx.viewerToken));
      assert.equal(res.status, 403);
    });
  });

  // ── GLOBAL EDGE CASES ─────────────────────────────────────────────────────
  describe('Global edge cases', { concurrency: false }, () => {
    test('Unknown route — 404 with clean message', async () => {
      const res = await api.get('/api/v1/doesnotexist');
      assert.equal(res.status, 404);
      assert.equal(res.body.success, false);
      assert.ok(res.body.message);
    });

    test('Malformed token — 401', async () => {
      const res = await api.get('/api/v1/records').set({ Authorization: 'Bearer this.is.garbage' });
      assert.equal(res.status, 401);
    });

    test('No token on protected route — 401', async () => {
      const res = await api.get('/api/v1/dashboard/summary');
      assert.equal(res.status, 401);
    });

    test('GET /health — server is up', async () => {
      const res = await api.get('/health');
      assert.equal(res.status, 200);
      assert.equal(res.body.status, 'ok');
    });
  });

});
