# Finance Data Processing and Access Control Backend

A backend for a finance dashboard with role-based access control, built with Node.js, Express, PostgreSQL (Supabase), and Prisma ORM.

> **Live API:** `https://financial-backend-axa5.onrender.com`
> **Swagger Docs:** `https://financial-backend-axa5.onrender.com/api-docs`
> **Health Check:** `https://financial-backend-axa5.onrender.com/health`

*(Update these URLs after deploying to Render)*

---

## Tech Stack
| Layer        | Choice                                   |
|--------------|------------------------------------------|
| Runtime      | Node.js 18+ with Express.js              |
| Database     | PostgreSQL via Prisma ORM                |
| DB Hosting   | Supabase (managed Postgres)              |
| App Hosting  | Render (web service)                     |
| Auth         | JWT (stateless, 7-day expiry)            |
| Validation   | Joi                                      |
| API Docs     | Swagger UI at `/api-docs`                |
| Testing      | Node.js built-in test runner + supertest |

---

## Role Permission Matrix

| Endpoint / Action              | Viewer | Analyst | Admin |
|--------------------------------|--------|---------|-------|
| Register (public)              | ✅     | ✅      | ✅    |
| Login (public)                 | ✅     | ✅      | ✅    |
| Dashboard summary              | ✅     | ✅      | ✅    |
| View records (capped at 20)    | ✅     | ✅      | ✅    |
| View single record by ID       | ✅     | ✅      | ✅    |
| Filter by amount range         | ❌     | ✅      | ✅    |
| Sort by amount / category      | ❌     | ✅      | ✅    |
| Category breakdown             | ❌     | ✅      | ✅    |
| Monthly trends                 | ❌     | ✅      | ✅    |
| Recent activity                | ❌     | ✅      | ✅    |
| Create / update / delete record| ❌     | ❌      | ✅    |
| Manage users (CRUD + status)   | ❌     | ❌      | ✅    |

---

## Project Structure
```
/prisma
  schema.prisma       → data model (User, FinancialRecord, enums)
  seed.js             → 3 demo users + 28 financial records (idempotent)
  /migrations         → tracked schema history

/src
  /config
    env.js            → validates required env vars on startup
    swagger.js        → OpenAPI spec via swagger-jsdoc

  /constants
    roles.js          → ROLES enum
    recordTypes.js    → RECORD_TYPES enum
    userStatus.js     → USER_STATUS enum
    messages.js       → centralised error/success strings

  /middlewares
    auth.middleware.js          → JWT verification, attaches req.user
    role.middleware.js          → role-based route guard
    active-user.middleware.js   → rejects INACTIVE users
    validate.middleware.js      → Joi schema validation for req.body
    error.middleware.js         → global error handler
    not-found.middleware.js     → 404 fallback

  /utils
    ApiError.js       → typed operational errors with status codes
    ApiResponse.js    → consistent { success, message, data, meta } envelope
    asyncHandler.js   → wraps async route handlers, forwards errors to Express
    pagination.js     → skip/take + meta (page, totalPages, hasNextPage …)
    queryParser.js    → role-aware query parsing for records listing

  /modules
    /auth             → register, login (routes / controller / service / validation)
    /users            → admin user management (routes / controller / service / validation)
    /records          → financial record CRUD (routes / controller / service / validation)
    /dashboard        → summary, category breakdown, monthly trends, recent activity

/tests
  api.test.js         → 40+ integration tests covering RBAC, pagination, filters, edge cases
```

---

## API Endpoints

```
# Auth (public)
POST   /api/v1/auth/register
POST   /api/v1/auth/login

# Users (Admin only)
GET    /api/v1/users
POST   /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
PATCH  /api/v1/users/:id/status

# Records (role-restricted)
GET    /api/v1/records            all roles — viewer capped at 20, limited filters/sort
POST   /api/v1/records            Admin only
GET    /api/v1/records/:id        all roles
PATCH  /api/v1/records/:id        Admin only
DELETE /api/v1/records/:id        Admin only (soft delete)

# Dashboard
GET    /api/v1/dashboard/summary             all roles
GET    /api/v1/dashboard/category-breakdown  Analyst + Admin
GET    /api/v1/dashboard/monthly-trends      Analyst + Admin
GET    /api/v1/dashboard/recent-activity     Analyst + Admin

# Utility
GET    /health
GET    /api-docs                  Swagger UI
```

---

## Key Design Decisions

- **Public register always creates VIEWER role.** Admin can explicitly create users with any role via `POST /users`. This prevents privilege escalation through self-registration.
- **Role enforcement lives in middleware chains**, not controllers. Each route composes `authenticate → ensureActive → authorizeRoles(...)` so controllers stay thin and business-logic-free.
- **Soft delete for records, status toggle for users.** Financial records are never hard-deleted — `isDeleted` + `deletedAt` preserves audit history. Users are deactivated rather than removed.
- **Viewer restrictions enforced in `queryParser.js`.** The 20-result cap, limited sort fields (`date` only), and no amount-range filters are applied at query-parse time — before any DB call — rather than post-processing results.
- **Prisma Decimal → plain float at the service layer.** `serializeRecord()` converts `Decimal` to `parseFloat()` so JSON responses always contain numbers, not Prisma wrapper objects.
- **Single PrismaClient instance per module.** Avoids connection pool exhaustion in long-running processes.
- **Centralised error strings in `constants/messages.js`.** All user-facing error messages are defined once; no string literals scattered across controllers.

---

## Assumptions

| Area | Assumption | Reasoning |
|------|------------|-----------|
| Registration role | Public `/register` always assigns VIEWER | Prevents privilege escalation; Admins use `/users` to create elevated accounts |
| Record ownership | Any Admin can update/delete any record | No per-user record ownership — it's a shared finance dashboard, not a personal tracker |
| Soft delete visibility | Soft-deleted records are excluded from all API responses | Keeps the API behaviour predictable; no "show deleted" toggle needed for this scope |
| Viewer result cap | Viewer gets max 20 records regardless of `?limit=` param | Role-based data throttling; Analysts/Admins can request up to 100 |
| Amount field | Stored as `Decimal(12,2)` | Avoids floating-point rounding errors for financial figures |
| Date field | Stored as `DateTime` at midnight UTC for the given date | Simplifies date-range queries; no timezone conversion needed at this scope |
| Password storage | bcrypt with salt rounds = 10 | Industry standard; rounds=10 balances security and performance |
| JWT expiry | 7 days, no refresh token | Sufficient for an internal dashboard; refresh token flow is out of scope |
| User deletion | Not implemented (status toggle only) | Preserves referential integrity — records reference `createdById` |

---

## Tradeoffs

| Decision | Upside | Downside |
|----------|--------|----------|
| No refresh token | Simpler auth flow, fewer endpoints | Token can't be revoked before expiry; mitigated by 7-day lifetime |
| Single `queryParser.js` for all role logic | Role restrictions in one place, easy to audit | Gets complex if roles and filters grow significantly |
| Soft delete only | Audit trail preserved | DB grows over time; needs a periodic cleanup job in production |
| Synchronous Joi validation middleware | Simple, predictable error format | No async custom validators (e.g. pre-insert uniqueness check); handled by catching Prisma P2002 instead |
| `groupBy` for category breakdown | Single DB query | Prisma `groupBy` with `_sum` + `_count` is PostgreSQL 15 tested (Supabase) |
| No rate limiting | Simpler implementation | In production, `/auth/login` needs rate limiting to prevent brute-force |

---

## Running Tests

```bash
npm test
```

Tests use the live Supabase database. All 40+ tests run sequentially (`concurrency: false`) because they share state (tokens, created record IDs). Coverage:
- Auth: register, login, duplicate email, missing fields, wrong password
- Users: CRUD, role restrictions, status toggle, invalid inputs
- Records: CRUD, RBAC, pagination, filters (date, type, amount, category), soft delete lifecycle
- Dashboard: all 4 endpoints, role access, data correctness (`netBalance = totalIncome - totalExpenses`)
- Global: unknown routes, malformed tokens, missing tokens, health check

---

## Deployment (Render)

The repo includes a `render.yaml` for zero-config deployment.

1. Push to GitHub
2. Go to [render.com](https://render.com) → **New Web Service** → connect your repo
3. Render auto-detects `render.yaml`. Set these 3 environment variables in the Render dashboard:
   - `DATABASE_URL` — Supabase **transaction pooler** URL (port 6543)
   - `DIRECT_URL` — Supabase **direct connection** URL (port 5432)
   - `JWT_SECRET` — any long random string
4. Click **Deploy**

The build command runs `prisma generate → prisma migrate deploy → node prisma/seed.js` automatically. The seed is idempotent: users always upsert safely, records only insert if the table is empty — so redeployments never duplicate or wipe data.

---

## Setup (Local)
See [SETUP.md](./SETUP.md) for full local setup instructions.
