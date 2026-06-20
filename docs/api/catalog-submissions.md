# Catalog Submissions API

Contributor requests for new programs and courses. **Programs** enter a moderation queue; **courses** with at least one valid `programId` are auto-approved into the live catalog.

Types: [`src/types/api/catalog-submissions.ts`](../../src/types/api/catalog-submissions.ts)

## Submission behavior

| Type      | `programIds`     | Result                                               |
| --------- | ---------------- | ---------------------------------------------------- |
| `PROGRAM` | —                | `PENDING` → moderator approve/reject                 |
| `COURSE`  | non-empty, valid | `APPROVED` immediately; live course created          |
| `COURSE`  | empty            | `PENDING` → moderator approve/reject (API edge case) |

Course codes are normalized on submit (trim + collapse whitespace).

## `POST /api/catalog-submissions`

Create a catalog submission.

**Auth:** Contributor+

### Program submission body

```json
{
  "type": "PROGRAM",
  "institutionId": "clx...",
  "programName": "Computer Science",
  "programType": "BACHELOR"
}
```

`ProgramType`: `BACHELOR` | `BTECH` | `BTECH_TOP_UP` | `HND` | `DIPLOMA`

### Course submission body

```json
{
  "type": "COURSE",
  "institutionId": "clx...",
  "courseCode": "DCIT 101",
  "courseTitle": "Introduction to Programming",
  "programIds": ["clx..."]
}
```

`programIds` should include at least one program belonging to `institutionId` for auto-approve. The upload form always sends the selected program.

**Response `201` (auto-approved course):**

```json
{
  "submission": {
    "id": "clx...",
    "type": "COURSE",
    "status": "APPROVED",
    "approvedCourseId": "clx...",
    "reviewedAt": "...",
    "...": "..."
  }
}
```

**Response `201` (pending program):**

```json
{
  "submission": {
    "id": "clx...",
    "type": "PROGRAM",
    "status": "PENDING",
    "approvedProgramId": null,
    "reviewedAt": null,
    "...": "..."
  }
}
```

**Errors:**

- `404` institution or program not found
- `400` programs must belong to the same institution
- `409` duplicate live catalog entry, duplicate pending submission, or duplicate course code

---

## `GET /api/catalog-submissions`

List the current user's catalog submissions.

**Auth:** Contributor+

**Query parameters:**

| Param           | Type   | Description                       |
| --------------- | ------ | --------------------------------- |
| `institutionId` | string | Filter by institution             |
| `status`        | string | `PENDING`, `APPROVED`, `REJECTED` |

**Response `200`:**

```json
{
  "submissions": [ { ... } ]
}
```

---

## `GET /api/moderation/catalog-submissions`

List catalog submissions for the moderation queue (primarily pending **programs**).

**Auth:** Moderator+

**Query parameters:**

| Param    | Type   | Description                        |
| -------- | ------ | ---------------------------------- |
| `status` | string | Default `PENDING`; also `REJECTED` |
| `page`   | number | Default `1`                        |
| `limit`  | number | Default `20`, max `50`             |

**Response `200`:**

```json
{
  "submissions": [ { ... } ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "totalPages": 1
  }
}
```

---

## `PATCH /api/moderation/catalog-submissions/:submissionId`

Approve or reject a **pending** catalog submission.

**Auth:** Moderator+

**Body:**

```json
{ "action": "approve" }
```

```json
{ "action": "reject", "reason": "Duplicate of existing program" }
```

**Response `200`:**

```json
{ "status": "APPROVED" }
```

On approve, the server creates the live program or course using the same validation as admin catalog CRUD.

**Errors:**

- `400` rejection reason required
- `404` submission or institution not found
- `409` invalid state transition or duplicate catalog entry on approve

## Notifications

| Event                            | Recipient  | Link                                  |
| -------------------------------- | ---------- | ------------------------------------- |
| Program pending                  | Moderator+ | `/moderation/catalog`                 |
| Course pending (no programIds)   | Moderator+ | `/moderation/catalog`                 |
| Course auto-approved             | Moderator+ | `/moderation/catalog` (informational) |
| Program/course approved (manual) | Submitter  | `/pascos/new?...`                     |
| Rejected                         | Submitter  | `/pascos/new`                         |

## Related docs

- [catalog.md](catalog.md) — live catalog CRUD (admin)
- [authentication.md](../authentication.md) — roles and permissions
