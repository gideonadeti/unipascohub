# Uni Pasco Hub — Agent Guide

## Quick start

```bash
pnpm install
cp .env.example .env                  # fill in Clerk + Cloudinary values
echo "postgres" > secrets/postgres_password.txt
docker compose -f compose.yaml -f compose.local.yaml up -d
pnpm prisma migrate dev && pnpm prisma generate
pnpm seed-institutions && pnpm seed-atu-programs && pnpm seed-atu-eee-courses
pnpm dev
```

## Commands

| Command                           | What it does                                                    |
| --------------------------------- | --------------------------------------------------------------- |
| `pnpm dev`                        | Next.js dev server                                              |
| `pnpm lint`                       | Biome check (lint+format)                                       |
| `pnpm format`                     | Biome write                                                     |
| `pnpm typecheck`                  | `tsc --noEmit`                                                  |
| `pnpm build`                      | `next build` (CI runs this last)                                |
| `pnpm seed-institutions`          | Upsert Ghanaian institutions from Wikipedia                     |
| `pnpm seed-atu-programs`          | Upsert ATU programs                                             |
| `pnpm seed-atu-eee-courses`       | Upsert ATU EEE Level 100 Semester 1 courses                     |
| `pnpm db:deploy`                  | Production: `prisma migrate deploy` then all three seeds        |
| `pnpm vercel-build`               | Vercel build: `prisma generate` → `pnpm db:deploy` → next build |
| `pnpm cleanup:cloudinary-orphans` | Scan/delete orphan Cloudinary assets (dry-run by default)       |

**Pre-commit order**: lint-staged runs `biome check --write` on staged files.

**CI order** (PRs to `main`): `pnpm prisma generate` → `pnpm lint` → `pnpm typecheck` → `pnpm build`. Run locally before pushing.

**No test framework or test script exists.** Only CI checks are lint, typecheck, build.

## Architecture

- **Next.js 16 App Router** — all route handlers export `runtime = "nodejs"` (no edge runtime)
- **Prisma 7 + PostgreSQL** — client generated to `generated/prisma/` (gitignored, requires `pg_trgm` extension for search indexes)
- **Clerk** for auth; a local `User` row stores roles (`NORMAL_USER`/`CONTRIBUTOR`/`MODERATOR`/`ADMIN`). Users synced via webhooks (`/api/webhooks`) + SSR fallback (`EnsureUserSynced`).
- **Cloudinary** for file storage (unsigned upload preset); all view/download URLs are time-limited and signed. PDFs must use `resourceType: IMAGE`. Spreadsheets are not allowed.
- **Redis** for distributed rate limiting (optional — falls back to in-memory store)
- **TanStack Query** on the client (`src/hooks/api/` → `src/lib/api/` wrappers)
- **shadcn/ui** (Radix Maia style) with **Tailwind CSS 4**
- **Biome** for lint + format; **Husky + lint-staged** pre-commit
- **React Compiler** enabled in `next.config.ts`

## Code conventions

- Business rules in `src/lib/`, not in route handlers
- Zod schemas in `src/lib/schemas/`; react-hook-form on the client
- API wrappers in `src/lib/api/`; TanStack Query hooks in `src/hooks/api/`
- Shared API types in `src/types/api/` — match the server serialization
- Path alias `@/*` → `./src/*`
- shadcn components in `src/components/ui/` — Biome overrides disable a11y rules in that folder
- All routes public at edge except `/api/users/*`, `/api/cloudinary/sign*`, `/api/admin/*` (protected via Clerk middleware in `src/proxy.ts`). Write mutations enforce auth+role inside handlers.
- Cloudinary orphan cleanup script at `scripts/cleanup-cloudinary-orphans.ts`

## Database

- Migrations: `pnpm prisma migrate dev --name <desc>` then `pnpm prisma generate`
- Seeds: `prisma/seed-*.ts` files, each registered as `pnpm seed-<name>` in `package.json` (no `prisma db seed`)
- Never edit applied migration files
- DB password stored in `secrets/postgres_password.txt` (Docker secret)

## Docker

- `compose.yaml` has Postgres 18 only
- `compose.local.yaml` adds Redis 8 + restricts Postgres port to localhost — use both: `-f compose.yaml -f compose.local.yaml`

## Docs worth reading

- `docs/architecture.md` — request flow, folder structure, design decisions
- `docs/development.md` — full setup guide including Clerk/Cloudinary config
- `docs/data-model.md` — DB schema
- `docs/file-uploads.md` — upload pipeline
- `docs/authentication.md` — roles and permission gates
- `docs/frontend-standards.md` — UI/UX conventions
- `docs/operations.md` — admin ops and maintenance
- `CONTRIBUTING.md` — code conventions and docs maintenance table
