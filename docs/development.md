# Development Guide

Step-by-step instructions for running Uni Pasco Hub locally.

## Prerequisites

- **Node.js 24** (matches CI — see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml))
- **pnpm 11** (`corepack enable && corepack prepare pnpm@11.4.0 --activate`)
- **Docker** (for local PostgreSQL)
- Accounts for **Clerk** and **Cloudinary** (free tiers are sufficient for development)

## Setup

### 1. Clone and install

```bash
git clone <repository-url>
cd unipascohub
pnpm install
```

### 2. PostgreSQL via Docker Compose

The project uses [`compose.yaml`](../compose.yaml) for a local Postgres 18 instance.

Create the password secret file before starting:

```bash
mkdir -p secrets
echo "your-local-password" > secrets/postgres_password.txt
```

Start the database:

```bash
docker compose up -d
```

Set `DATABASE_URL` in `.env` (copy from [`.env.example`](../.env.example)):

```text
DATABASE_URL="postgresql://postgres:your-local-password@localhost:5432/unipascohub"
```

### 3. Environment variables

```bash
cp .env.example .env
```

Fill in all required values. See [`.env.example`](../.env.example) for the full list and where to obtain each value.

### 4. Prisma migrations

```bash
pnpm prisma migrate dev
pnpm prisma generate
```

- Migrations live in [`prisma/migrations/`](../prisma/migrations/)
- Generated client output: `generated/prisma/`
- Config: [`prisma.config.ts`](../prisma.config.ts)
- Search requires the `pg_trgm` extension (applied by migration `20260618100000_add_pg_trgm_course_search_indexes`). Most managed Postgres providers support `CREATE EXTENSION pg_trgm`; confirm before production deploy.

### 5. Clerk configuration

1. Create an application at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy the publishable and secret keys into `.env`.
3. Add a webhook endpoint pointing to `https://<your-dev-url>/api/webhooks` (use [ngrok](https://ngrok.com/) or Clerk's dev tunnel for local testing).
4. Subscribe to `user.created`, `user.updated`, and `user.deleted` events.
5. Copy the webhook signing secret to `CLERK_WEBHOOK_SIGNING_SECRET`.

The app also syncs users on page load via [`src/components/ensure-user-synced.tsx`](../src/components/ensure-user-synced.tsx) as a fallback when webhooks are delayed.

### 6. Cloudinary configuration

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com/).
2. Add API credentials to `.env`.
3. Create an **unsigned upload preset** (Settings → Upload → Upload presets).
4. Set `CLOUDINARY_UPLOAD_PRESET` to the preset name.

Allowed file types are defined in [`src/lib/pasco-file-types.ts`](../src/lib/pasco-file-types.ts): PDF, images, and documents (not spreadsheets).

### 7. Run the dev server

```bash
pnpm dev
```

Smoke-check:

- `/` — API smoke test (institution and pasco counts)
- `/pascos/new` — upload form (requires sign-in + contributor role)

### 8. Seed catalog data (manual)

There is no seed script yet. To test uploads, create catalog data via admin API calls or Prisma Studio:

```bash
pnpm prisma studio
```

You need at least one institution, program, and course before creating a pasco. Catalog mutations require an `ADMIN` user (set role directly in the database for local dev).

## CI expectations

Pull requests to `main` run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Run these locally before pushing. Husky pre-commit hooks run lint-staged when not in CI.

## Troubleshooting

### Prisma: connection refused

- Confirm Docker is running: `docker compose ps`
- Check `DATABASE_URL` host, port, password, and database name (`unipascohub`)

### Clerk: Unauthorized on protected routes

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` match the same Clerk application
- Ensure you are signed in for routes that require authentication

### Clerk webhook: user not in database

- Confirm webhook URL is reachable and signing secret is correct
- Check server logs for verification errors in [`src/app/api/webhooks/route.ts`](../src/app/api/webhooks/route.ts)
- `EnsureUserSynced` should create the user on first page load as a fallback

### Cloudinary: upload fails

- Verify unsigned upload preset name matches `CLOUDINARY_UPLOAD_PRESET`
- Check file type is allowed (no spreadsheets)
- Confirm file size is under `PASCO_MAX_FILE_SIZE_BYTES` (default 10 MB)

### Pasco create: course not found

- Catalog must be seeded with institutions, programs, and courses
- The selected course must exist and match the institution/program filters in the form

### Rate limiting in development

Without `REDIS_URL`, rate limits use an in-memory store (single process only). This is fine for local dev. Set `REDIS_URL` to test distributed rate limiting.

## When you change things, update docs

| Change        | Update                                                  |
| ------------- | ------------------------------------------------------- |
| New env var   | [`.env.example`](../.env.example), this file            |
| New migration | [`docs/data-model.md`](data-model.md) if schema changes |
| New API route | [`docs/api/`](api/)                                     |
