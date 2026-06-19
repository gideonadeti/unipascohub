# Pasco API

Pasco CRUD, file operations, and engagement endpoints.

Types: [`src/types/api/pascos.ts`](../../src/types/api/pascos.ts)

## List and create

### `GET /api/pascos`

List pascos with filters, pagination, and sorting.

**Auth:** None (includes `viewerReaction` when signed in)

**Rate limit:** 120 requests per 15 minutes per IP (configurable via `PASCO_LIST_RATE_LIMIT`, `PASCO_LIST_RATE_WINDOW_MS`). Returns `429` with optional `Retry-After` when exceeded.

**Query parameters:**

| Param            | Type    | Default     | Description                                                                                         |
| ---------------- | ------- | ----------- | --------------------------------------------------------------------------------------------------- |
| `courseId`       | string  | —           | Filter by course                                                                                    |
| `educationLevel` | enum    | —           | `LEVEL_100` … `LEVEL_400`                                                                           |
| `academicYear`   | string  | —           | Format `YYYY/YYYY`                                                                                  |
| `semesterType`   | enum    | —           | `FIRST_SEMESTER`, `SECOND_SEMESTER`                                                                 |
| `type`           | enum    | —           | `MID_SEM`, `END_OF_SEM`, `RESIT`                                                                    |
| `contentType`    | enum    | —           | `QUESTIONS_ONLY`, `QUESTIONS_AND_ANSWERS`, `ANSWERS_ONLY`                                           |
| `isComplete`     | boolean | —           | Filter by upload completeness                                                                       |
| `page`           | integer | 1           | Page number (≥ 1)                                                                                   |
| `limit`          | integer | 20          | Page size (1–100)                                                                                   |
| `sortBy`         | enum    | `createdAt` | `createdAt`, `updatedAt`, `academicYear`, `likeCount`, `dislikeCount`, `downloadCount`, `viewCount` |
| `sortOrder`      | enum    | `desc`      | `asc` or `desc`                                                                                     |

**Response `200`:**

```json
{
  "pascos": [ { "...Pasco fields..." } ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}
```

Each pasco includes `viewerReaction` (`LIKE`, `DISLIKE`, or `null`) when the request is authenticated.

---

### `POST /api/pascos`

Create a pasco with files.

**Auth:** Contributor+

**Body:**

```json
{
  "courseId": "clx...",
  "academicYear": "2024/2025",
  "educationLevel": "LEVEL_100",
  "semesterType": "FIRST_SEMESTER",
  "type": "END_OF_SEM",
  "contentType": "QUESTIONS_ONLY",
  "description": "Optional notes",
  "isComplete": true,
  "solutionCompleteness": null,
  "files": [
    {
      "order": 1,
      "publicId": "pascos/clx.../abc123",
      "fileName": "exam.pdf",
      "fileSize": 1048576,
      "fileUrl": "https://res.cloudinary.com/...",
      "resourceType": "IMAGE",
      "contentHash": "sha256hex..."
    }
  ]
}
```

`solutionCompleteness` must be omitted or null when `contentType` is `QUESTIONS_ONLY`.

**Response `201`:** `{ "pasco": { ... } }`

**Errors:**

- `409` `duplicate_file_content` — includes `duplicates` array with `contentHash`, `fileName`, `pascoId`
- `409` duplicate `publicId`
- `404` course not found
- `400` asset verification failures (folder mismatch, size mismatch, etc.)

## Single pasco

### `GET /api/pascos/:pascoId`

Get pasco detail.

**Auth:** None (includes `viewerReaction` when signed in)

**Response `200`:** `{ "pasco": { ... } }`

---

### `PATCH /api/pascos/:pascoId`

Update pasco metadata and/or sync files.

**Auth:** Uploader, moderator, or admin

**Body** (at least one field required):

```json
{
  "courseId": "clx...",
  "academicYear": "2024/2025",
  "description": "Updated notes",
  "educationLevel": "LEVEL_200",
  "semesterType": "SECOND_SEMESTER",
  "type": "MID_SEM",
  "contentType": "QUESTIONS_AND_ANSWERS",
  "solutionCompleteness": "FULLY_SOLVED",
  "isComplete": true,
  "files": [
    { "id": "existing-file-id", "order": 1 },
    {
      "order": 2,
      "publicId": "pascos/clx.../newfile",
      "fileName": "answers.pdf",
      "fileSize": 524288,
      "fileUrl": "https://res.cloudinary.com/...",
      "resourceType": "IMAGE",
      "contentHash": "sha256hex..."
    }
  ]
}
```

File sync: existing files referenced by `id` + `order`; new files use the create shape. Files not included are deleted from storage and database.

**Response `200`:**

```json
{
  "pasco": { "...updated pasco..." },
  "storageCleanupFailures": ["publicId1"]
}
```

`storageCleanupFailures` is present only when Cloudinary deletion failed for some removed files.

---

### `DELETE /api/pascos/:pascoId`

Delete a pasco and all its files.

**Auth:** Uploader, moderator, or admin

**Response `200`:**

```json
{
  "success": true,
  "storageCleanupFailures": []
}
```

## Engagement

### `PUT /api/pascos/:pascoId/reaction`

Set or clear the current user's reaction.

**Auth:** Signed in

**Rate limit:** 60 requests per 15 minutes per user (configurable)

**Body:**

```json
{ "reactionType": "LIKE" }
```

Set `reactionType` to `null` to remove a reaction. Sending the same type again toggles it off.

**Response `200`:**

```json
{
  "likeCount": 5,
  "dislikeCount": 1,
  "viewerReaction": "LIKE"
}
```

---

### `POST /api/pascos/:pascoId/view`

Record a view (deduped per viewer).

**Auth:** None (uses user ID when signed in, IP address otherwise)

**Rate limit:** Global 300 views per 15 minutes; per-viewer dedupe window 1 hour (configurable)

**Response `200`:**

```json
{
  "viewCount": 42,
  "recorded": true
}
```

`recorded: false` when the view was deduped within the window.

## File access

### `POST /api/pascos/:pascoId/files/:fileId/view`

Get a signed URL for in-app viewing.

**Auth:** Signed in

**Rate limit:** 120 requests per 15 minutes per user (shared with download)

**Response `200`:**

```json
{
  "fileUrl": "https://res.cloudinary.com/.../signed...",
  "fileName": "exam.pdf"
}
```

---

### `POST /api/pascos/:pascoId/files/:fileId/download`

Record a download and get a signed download URL.

**Auth:** Signed in

**Rate limit:** 120 requests per 15 minutes per user

**Response `200`:**

```json
{
  "downloadCount": 10,
  "fileUrl": "https://res.cloudinary.com/.../signed...",
  "fileName": "exam.pdf"
}
```

## Upload helpers

### `POST /api/cloudinary/sign`

Sign Cloudinary upload parameters for the widget.

**Auth:** Contributor+

**Rate limit:** 30 requests per 15 minutes per user

**Body:**

```json
{
  "courseId": "clx...",
  "fileName": "exam.pdf",
  "resourceType": "IMAGE"
}
```

**Response `200`:** Cloudinary signature payload (timestamp, signature, folder, etc.)

Files are uploaded to folder `pascos/{courseId}/`.

---

### `POST /api/pascos/files/compute-hash`

Compute SHA-256 content hash for an uploaded Cloudinary asset.

**Auth:** Contributor+

**Body:**

```json
{
  "courseId": "clx...",
  "publicId": "pascos/clx.../abc123",
  "fileName": "exam.pdf",
  "fileSize": 1048576,
  "fileUrl": "https://res.cloudinary.com/...",
  "resourceType": "IMAGE"
}
```

**Response `200`:** `{ "contentHash": "sha256hex..." }`

---

### `POST /api/pascos/files/check-duplicates`

Check content hashes against existing pasco files.

**Auth:** Contributor+

**Body:**

```json
{
  "courseId": "clx...",
  "contentHashes": ["sha256hex1", "sha256hex2"]
}
```

**Response `200`:**

```json
{
  "duplicates": [
    {
      "contentHash": "sha256hex1",
      "fileName": "exam.pdf",
      "pascoId": "clx..."
    }
  ],
  "message": "Optional human-readable summary"
}
```

## Pasco object shape

```json
{
  "id": "clx...",
  "courseId": "clx...",
  "uploaderId": "user_...",
  "academicYear": "2024/2025",
  "description": null,
  "educationLevel": "LEVEL_100",
  "semesterType": "FIRST_SEMESTER",
  "type": "END_OF_SEM",
  "contentType": "QUESTIONS_ONLY",
  "solutionCompleteness": null,
  "isComplete": true,
  "likeCount": 0,
  "dislikeCount": 0,
  "downloadCount": 0,
  "viewCount": 0,
  "files": [
    {
      "id": "clx...",
      "pascoId": "clx...",
      "order": 1,
      "fileName": "exam.pdf",
      "fileSize": 1048576,
      "fileUrl": "https://res.cloudinary.com/...",
      "resourceType": "IMAGE",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "createdAt": "...",
  "updatedAt": "...",
  "viewerReaction": null
}
```

Note: `publicId` and `contentHash` are not exposed in API responses.
