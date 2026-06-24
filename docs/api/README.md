# API Reference

REST API for Uni Pasco Hub. All endpoints return JSON.

## Conventions

### Base URL

- Development: `http://localhost:3000`
- Production: your deployed origin

### Authentication

Most write endpoints require a Clerk session cookie or bearer token. Public read endpoints (catalog, pasco list/detail) work without authentication.

### Dates

All timestamps are ISO 8601 strings (e.g. `"2026-06-17T14:11:35.000Z"`).

### Enums

Enum values use `SCREAMING_SNAKE_CASE` (e.g. `LEVEL_100`, `FIRST_SEMESTER`). See [data-model.md](../data-model.md) for meanings.

### Pagination

List endpoints that paginate return:

```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### Error responses

```json
{ "error": "Human-readable message" }
```

Some errors include extra fields (e.g. `duplicate_file_content` with a `duplicates` array).

| Status | Meaning                                                     |
| ------ | ----------------------------------------------------------- |
| 400    | Invalid request body or parameters                          |
| 401    | Not signed in                                               |
| 403    | Signed in but insufficient permissions                      |
| 404    | Resource not found                                          |
| 409    | Conflict (duplicate name, duplicate file, already upgraded) |
| 429    | Rate limited (`Retry-After` header may be present)          |
| 500    | Internal server error                                       |

### Type definitions

Shared TypeScript types live in [`src/types/api/`](../../src/types/api/).

## API sections

| Doc                                              | Endpoints                         |
| ------------------------------------------------ | --------------------------------- |
| [catalog.md](catalog.md)                         | Institutions, programs, courses   |
| [catalog-submissions.md](catalog-submissions.md) | Catalog submission and moderation |
| [pascos.md](pascos.md)                           | Pasco CRUD, engagement, files     |
| [feedback.md](feedback.md)                       | Feedback submission and management |
| [users.md](users.md)                             | Current user, role upgrades       |
| [admin.md](admin.md)                             | Cloudinary cleanup, storage logs, moderation settings |

## Webhooks

| Method | Path            | Auth            | Description                            |
| ------ | --------------- | --------------- | -------------------------------------- |
| POST   | `/api/webhooks` | Clerk signature | Syncs user create/update/delete events |

Not intended for client use. Configure in the Clerk dashboard.
