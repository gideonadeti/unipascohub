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
| Pasco list         | 120 / IP      | 15 min | `PASCO_LIST_RATE_LIMIT`, `PASCO_LIST_RATE_WINDOW_MS`               |
| Search suggest     | 60 / IP       | 1 min  | (hardcoded in suggest route)                                         |

### Redis vs in-memory

- **`REDIS_URL` set:** distributed rate limiting (required for multi-instance production)
- **`REDIS_URL` unset:** in-memory fallback (single process only; logs a warning once)

Rate-limited responses return `429` with optional `Retry-After` header (seconds).

## Search analytics

Search queries (2+ characters) from `GET /api/search/suggest` and browse list requests with a `q` param are stored in the `SearchQuery` table for product improvement. Rows include the query text, source (`SUGGEST` or `BROWSE_LIST`), optional signed-in `userId`, result counts, and light metadata (parsed filters). No third-party analytics SDK is used for search in the current MVP.

Retention and purge of old rows are not automated yet; add a scheduled job if the table grows large.

## Signed URL TTL

Download and view URLs expire after `PASCO_DOWNLOAD_URL_TTL_SECONDS` (default 300 seconds). Clients should request fresh URLs rather than caching them long-term.

## Production checklist

- [ ] Set `NEXT_PUBLIC_APP_URL` to the canonical domain (e.g. `https://unipascohub.weamp.org`) — feedback submissions may 403 without it (CSRF origin validation)
- [ ] Set `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` for distributed rate limiting
- [ ] Configure Clerk production keys and webhook
- [ ] Set Cloudinary production credentials and upload preset
- [ ] Set PostHog keys (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`) — optional; analytics is inert without them
- [ ] Set Sentry DSN — optional; errors are still logged without it
- [ ] Set VAPID keys (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) — optional; push notifications are disabled without them
- [ ] Promote the first admin (see runbook below)
- [ ] Schedule periodic orphan cleanup (dry-run first, then execute)
- [ ] Monitor `StorageCleanupFailure` for unresolved entries
- [ ] Run `pnpm prisma migrate deploy` on deploy

## User administration runbooks

No API exists for ADMIN promotion or account deletion. Both are manual operations.

### Promote the first admin

1. Sign in once with the target Clerk account so a local `User` row exists (created by the Clerk webhook or the `EnsureUserSynced` SSR fallback)
2. Promote the role — `User.id` equals the Clerk user ID (visible in the Clerk dashboard):

```sql
UPDATE "User" SET role = 'ADMIN' WHERE id = '<clerk-user-id>';
```

Prisma Studio (`pnpm prisma studio`) works too. Lower roles: NORMAL_USER → CONTRIBUTOR is self-service (`POST /api/users/upgrade-to-contributor`); → MODERATOR goes through the admin users API. See [authentication.md](authentication.md).

### Delete a user account (data deletion requests)

The privacy policy promises data deletion on request. Manual process:

1. Delete the user in the Clerk dashboard. The `user.deleted` webhook then removes the local `User` row (`src/lib/user-sync.ts`) — this requires the Clerk webhook to be configured
2. Related rows cascade (`PascoReaction`, `PascoDownload`, `Notification`, `PushSubscription`, submitted `CatalogSubmission`); `Pasco.uploaderId`, `SearchQuery.userId`, `Feedback.userId`, and `StorageCleanup*` user references become `NULL` via `SetNull`
3. The user's pascos remain published with no uploader. If the requester wants those removed too, delete them via the contributions UI or moderation tooling — pasco deletion also removes their Cloudinary assets
4. If any assets were stranded, run the orphan cleanup above

## Related docs

- [file-uploads.md](file-uploads.md) — upload pipeline and delete behavior
- [api/admin.md](api/admin.md) — admin API reference
- [development.md](development.md) — local setup
