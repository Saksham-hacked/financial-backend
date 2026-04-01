# Finance Data Processing and Access Control Backend

A backend for a finance dashboard with role-based access control, built with Node.js, Express, PostgreSQL, and Prisma.

## Tech Stack
- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT (access token)
- **Validation**: Joi
- **Docs**: Swagger UI at `/api-docs`

## Role Permission Matrix

| Endpoint / Action       | Viewer | Analyst | Admin |
|-------------------------|--------|---------|-------|
| Basic dashboard summary | ✅     | ✅      | ✅    |
| View records (limited)  | ✅     | ✅      | ✅    |
| Advanced filters        | ❌     | ✅      | ✅    |
| Category breakdown      | ❌     | ✅      | ✅    |
| Monthly trends          | ❌     | ✅      | ✅    |
| Create record           | ❌     | ❌      | ✅    |
| Update record           | ❌     | ❌      | ✅    |
| Soft delete record      | ❌     | ❌      | ✅    |
| Manage users            | ❌     | ❌      | ✅    |

## Project Structure
```
/prisma          → schema + seed
/src
  /config        → env, swagger
  /constants     → roles, enums, messages
  /middlewares   → auth, roles, validation, errors
  /utils         → ApiError, ApiResponse, pagination, queryParser
  /modules
    /auth        → register, login
    /users       → CRUD (admin only)
    /records     → CRUD + paginated listing
    /dashboard   → summary, breakdown, trends
```

## Key Design Decisions
- **Public register** creates VIEWER-role users. Admin can create users with any role.
- **Soft delete only** for financial records. Users are activated/deactivated instead.
- **Role enforcement** happens in middleware chains on each route — not in controllers.
- **Viewer restrictions** enforced in `queryParser.js`: max 20 results, only basic filters/sort.
- **Prisma Decimal** serialized to plain JS float at the service layer — no surprises in JSON.

## API Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login

GET    /api/v1/users              (Admin)
POST   /api/v1/users              (Admin)
GET    /api/v1/users/:id          (Admin)
PATCH  /api/v1/users/:id          (Admin)
PATCH  /api/v1/users/:id/status   (Admin)

GET    /api/v1/records            (All roles, role-restricted filters)
POST   /api/v1/records            (Admin)
GET    /api/v1/records/:id        (All roles)
PATCH  /api/v1/records/:id        (Admin)
DELETE /api/v1/records/:id        (Admin, soft delete)

GET    /api/v1/dashboard/summary            (All roles)
GET    /api/v1/dashboard/category-breakdown (Analyst, Admin)
GET    /api/v1/dashboard/monthly-trends     (Analyst, Admin)
GET    /api/v1/dashboard/recent-activity    (Analyst, Admin)
```

## Setup
See [SETUP.md](./SETUP.md) for full instructions.
