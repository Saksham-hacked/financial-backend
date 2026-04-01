# Setup Guide

## Prerequisites
- Node.js 18+
- A PostgreSQL database — local or **Supabase** (free tier works fine)

---

## Option A: Using Supabase (Recommended)

### 1. Create a Supabase project
Go to https://supabase.com → New Project and note your **database password**.

### 2. Get your connection strings
Go to **Settings → Database → Connection string**.

You need **two** URLs:
- **Transaction pooler** (used at runtime): `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres`
- **Direct connection** (used for migrations only): `postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres`

### 3. Configure .env
```bash
cp .env.example .env
```
Fill in your values:
```env
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres"
JWT_SECRET=any_long_random_string_min_32_chars
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

---

## Option B: Local PostgreSQL

Create a database first:
```sql
CREATE DATABASE finance_db;
```

Then set both URLs to the same connection string:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/finance_db"
DIRECT_URL="postgresql://postgres:yourpassword@localhost:5432/finance_db"
```

---

## Install & Run

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npm run prisma:generate

# 3. Run migrations (creates tables)
npm run prisma:migrate

# 4. Seed demo data (3 users + 28 financial records)
npm run seed

# 5. Start the dev server
npm run dev
```

Server runs at: `http://localhost:3000`

---

## Quick Verify

Once the server is up, hit the health check:
```bash
curl http://localhost:3000/health
# → { "status": "ok" }
```

Then open Swagger to explore all endpoints interactively:
```
http://localhost:3000/api-docs
```

---

## Demo Credentials

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@finance.local      | password123 |
| Analyst | analyst@finance.local    | password123 |
| Viewer  | viewer@finance.local     | password123 |

Seed data includes 28 financial records spread across Jan–Jun 2024 in categories: Salary, Freelance, Investments, Rent, Food, Transport, Utilities, Entertainment.

---

## Postman Collection

Import `postman_collection.json` into Postman.

1. Set the `baseUrl` collection variable to `http://localhost:3000/api/v1`
2. Send **Login (Admin)** — the test script auto-saves the token to the `token` variable
3. All authenticated requests will use it automatically via `{{token}}`

---

## Running Tests

```bash
npm test
```

Tests run against the live database. All 40+ cases run sequentially to avoid shared-state race conditions. Expected output: all tests passing with no failures.

---

## Available npm Scripts

| Script                | Description                          |
|-----------------------|--------------------------------------|
| `npm run dev`         | Start dev server with nodemon        |
| `npm start`           | Start production server              |
| `npm test`            | Run integration test suite           |
| `npm run seed`        | Seed demo users and records          |
| `npm run prisma:generate` | Regenerate Prisma client         |
| `npm run prisma:migrate`  | Apply pending migrations         |
| `npm run prisma:studio`   | Open Prisma Studio (DB GUI)      |
