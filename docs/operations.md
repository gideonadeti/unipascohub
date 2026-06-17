# Operations

Maintenance tasks for storage, rate limiting, and cleanup failures.

## Cloudinary orphan cleanup

Orphan assets are files in Cloudinary under `pascos/` that have no matching `PascoFile.publicId` in the database. They can occur when uploads succeed but pasco creation fails, or from manual Cloudinary changes.

### CLI (recommended for scheduled jobs)

```bash
# Dry run (default) — scan and report only
pnpm cleanup:cloudinary-orphans

# Execute deletions
pnpm cleanup:cloudinary-orphans -- --execute

# Limit to one course folder
pnpm cleanup:cloudinary-orphans -- --course-id=clx...
pnpm cleanup:cloudinary-orphans -- --execute --course-id=clx...
```

Script: [`scripts/cleanup-cloudinary-orphans.ts`](../scripts/cleanup-cloudinary-orphans.ts)

### Admin API

`POST /api/admin/cloudinary/cleanup-orphans` with `{ "dryRun": true }` or `{ "dryRun": false }`.

See [api/admin.md](api/admin.md) for request/response details.

Both CLI and API log results to `StorageCleanupRun` and record deletion failures in `StorageCleanupFailure`.

## Storage cleanup failures

When Cloudinary asset deletion fails during:

- Pasco delete (`PASCO_DELETE`)
- Pasco file sync on edit (`PASCO_SYNC`)
- Orphan batch cleanup (`ORPHAN_BATCH`)

…the failure is recorded in `StorageCleanupFailure` with the `publicId`, `source`, and optional `pascoId`.

### Inspect failures

```bash
# Via API (admin auth required)
GET /api/admin/storage-cleanup/failures?resolved=false
GET /api/admin/storage-cleanup/failures?resolved=true
```

### Resolve failures

There is no resolve API yet. To mark a failure as resolved:

1. Manually delete the asset in the Cloudinary console, or retry deletion
2. Set `resolvedAt` in the database (Prisma Studio or SQL)

### Inspect cleanup runs

```bash
GET /api/admin/storage-cleanup/runs?limit=20
```

## Rate limiting

Implemented in [`src/lib/rate-limit.ts`](../src/lib/rate-limit.ts).

| Endpoint           | Default limit | Window | Env vars                                                           |
| ------------------ | ------------- | ------ | ------------------------------------------------------------------ |
| Cloudinary sign    | 30 / user     | 15 min | `CLOUDINARY_SIGN_RATE_LIMIT`, `CLOUDINARY_SIGN_RATE_WINDOW_MS`     |
| Reactions          | 60 / user     | 15 min | `PASCO_REACTION_RATE_LIMIT`, `PASCO_REACTION_RATE_WINDOW_MS`       |
| File view/download | 120 / user    | 15 min | `PASCO_DOWNLOAD_RATE_LIMIT`, `PASCO_DOWNLOAD_RATE_WINDOW_MS`       |
| View dedupe        | 1 / viewer    | 1 hour | `PASCO_VIEW_DEDUPE_WINDOW_MS`                                      |
| View global        | 300 total     | 15 min | `PASCO_VIEW_GLOBAL_RATE_LIMIT`, `PASCO_VIEW_GLOBAL_RATE_WINDOW_MS` |

### Redis vs in-memory

- **`REDIS_URL` set:** distributed rate limiting (required for multi-instance production)
- **`REDIS_URL` unset:** in-memory fallback (single process only; logs a warning once)

Rate-limited responses return `429` with optional `Retry-After` header (seconds).

## Signed URL TTL

Download and view URLs expire after `PASCO_DOWNLOAD_URL_TTL_SECONDS` (default 300 seconds). Clients should request fresh URLs rather than caching them long-term.

## Production checklist

- [ ] Set `REDIS_URL` for distributed rate limiting
- [ ] Configure Clerk production keys and webhook
- [ ] Set Cloudinary production credentials and upload preset
- [ ] Schedule periodic orphan cleanup (dry-run first, then execute)
- [ ] Monitor `StorageCleanupFailure` for unresolved entries
- [ ] Run `pnpm prisma migrate deploy` on deploy

## Related docs

- [file-uploads.md](file-uploads.md) — upload pipeline and delete behavior
- [api/admin.md](api/admin.md) — admin API reference
- [development.md](development.md) — local setup
