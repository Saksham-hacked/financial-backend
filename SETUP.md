# Setup Guide

## Prerequisites
- Node.js 18+
- A PostgreSQL database — local or **Supabase** (free tier works fine)

---

## Option A: Using Supabase (Recommended)

### 1. Create a Supabase project
- Go to https://supabase.com → New Project
- Note your **database password**

### 2. Get connection strings
Go to **Settings → Database → Connection string**

You need **two** URLs:
- **Transaction pooler** (for runtime): looks like `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres`
- **Direct connection** (for migrations): looks like `postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres`

### 3. Configure .env
```bash
cp .env.example .env
```
Fill in:
```
DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres"
JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
```

---

## Option B: Local PostgreSQL

```
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/finance_db"
DIRECT_URL="postgresql://postgres:yourpassword@localhost:5432/finance_db"
```
Create the DB first: `CREATE DATABASE finance_db;`

---

## Install & Run

### 1. Install dependencies
```bash
npm install
```

### 2. Generate Prisma client & run migrations
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 3. Seed demo data
```bash
npm run seed
```

### 4. Start the server
```bash
npm run dev
```

---

## Demo Credentials
| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@finance.local      | password123 |
| Analyst | analyst@finance.local    | password123 |
| Viewer  | viewer@finance.local     | password123 |

## API Docs
http://localhost:3000/api-docs

## Postman
Import `postman_collection.json`. Set `baseUrl` to `http://localhost:3000/api/v1`. After login, paste the token into the `token` collection variable.
