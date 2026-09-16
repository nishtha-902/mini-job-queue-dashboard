# Mini Job Queue Dashboard

A small full-stack job queue management dashboard built with React, Vite, NestJS, TypeORM and PostgreSQL.

## Stack

- Frontend: React 19 + Vite 8 + plain CSS
- Backend: NestJS 12 + TypeORM 1 + PostgreSQL
- Validation: class-validator + class-transformer
- Persistence: PostgreSQL
- Concurrency: atomic conditional UPDATE based on the current status

## Requirements

- Node.js 24+ recommended
- npm 11+
- PostgreSQL 14+

## 1. Database

Create a PostgreSQL database:

```sql
CREATE DATABASE job_queue_db;
```

## 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

Backend runs at `http://localhost:3000`.

## 3. Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at the URL Vite prints, normally `http://localhost:5173`.

## API

- `POST /jobs`
- `GET /jobs`
- `PATCH /jobs/:id/status`
- `DELETE /jobs/:id`

## Concurrency design

The backend is authoritative. The transition rule is never trusted to React.

For a status transition, the service first validates the requested transition against the current state, then performs an atomic conditional update:

```sql
UPDATE jobs
SET status = $1
WHERE id = $2
  AND status = $3;
```

If two requests both read `pending` and both request `running`, only one can change the row because the database operation requires the row to still be `pending`. The losing request gets a `409 Conflict`.

This protects the state even if a caller bypasses the React UI and calls the API directly.

For stronger production systems with multiple side effects, this same state transition can be placed inside a transaction together with any related writes/outbox event.
