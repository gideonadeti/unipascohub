# Admin API

Operational endpoints for storage maintenance. All require `ADMIN` role.

Types: [`src/types/api/storage-cleanup.ts`](../../src/types/api/storage-cleanup.ts)

## Cloudinary orphan cleanup

### `POST /api/admin/cloudinary/cleanup-orphans`

Scan Cloudinary for assets under `unipascohub/pascos/` that have no matching `PascoFile` record, and optionally delete them.

**Auth:** Admin

**Body** (all fields optional):

```json
{
  "dryRun": true,
  "courseId": "clx..."
}
```

| Field      | Type    | Default | Description                               |
| ---------- | ------- | ------- | ----------------------------------------- |
| `dryRun`   | boolean | `true`  | When `true`, scan only — no deletions     |
| `courseId` | string  | —       | Limit scan to `unipascohub/pascos/{courseId}/` folder |

**Response `200`:**

```json
{
  "dryRun": true,
  "courseId": null,
  "scanned": 150,
  "orphanCount": 3,
  "orphans": [
    {
      "publicId": "pascos/clx.../orphan123",
      "resourceType": "IMAGE",
      "bytes": 1048576,
      "createdAt": "..."
    }
  ],
  "deleted": [],
  "deleteFailures": []
}
```

When `dryRun` is `false`, `deleted` lists successfully removed assets and `deleteFailures` lists assets that could not be deleted. Failures are logged to `StorageCleanupFailure`.

Equivalent CLI: `pnpm cleanup:cloudinary-orphans` (see [operations.md](../operations.md)).

## Storage cleanup logs

### `GET /api/admin/storage-cleanup/runs`

List recent orphan cleanup runs.

**Auth:** Admin

**Query parameters:**

| Param   | Type    | Default | Description         |
| ------- | ------- | ------- | ------------------- |
| `limit` | integer | 20      | Max results (1–100) |

**Response `200`:**

```json
{
  "runs": [
    {
      "id": "clx...",
      "dryRun": true,
      "courseId": null,
      "scanned": 150,
      "orphanCount": 3,
      "deletedCount": 0,
      "failureCount": 0,
      "triggeredById": "user_...",
      "details": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### `GET /api/admin/storage-cleanup/failures`

List storage cleanup failures (assets that failed to delete).

**Auth:** Admin

**Query parameters:**

| Param      | Type    | Default | Description                                                          |
| ---------- | ------- | ------- | -------------------------------------------------------------------- |
| `resolved` | boolean | `false` | When `true`, return resolved failures; when `false`, unresolved only |

**Response `200`:**

```json
{
  "failures": [
    {
      "id": "clx...",
      "publicId": "pascos/clx.../file123",
      "resourceType": "IMAGE",
      "source": "PASCO_DELETE",
      "pascoId": "clx...",
      "triggeredById": "user_...",
      "createdAt": "...",
      "updatedAt": "...",
      "resolvedAt": null
    }
  ]
}
```

`source`: `PASCO_SYNC` | `PASCO_DELETE` | `ORPHAN_BATCH`

There is no API to mark failures as resolved yet; update `resolvedAt` directly in the database or via Prisma Studio.

---

## Moderation settings

### `GET /api/admin/settings/moderation`

Read the dislike threshold for auto-moderation.

**Auth:** Moderator or admin

**Response `200`:** `{ "dislikeThreshold": 5 }`

### `PATCH /api/admin/settings/moderation`

Update the dislike threshold.

**Auth:** Admin

**Body:** `{ "dislikeThreshold": 5 }`

**Response `200`:** `{ "dislikeThreshold": 5 }`
