# Feedback API

User feedback submissions and moderation.

## Submit feedback

### `POST /api/feedback`

Submit feedback from a signed-in user.

**Auth:** Signed in

**Rate limit:** 10 requests per 60 seconds per IP (configurable). Returns `429` when exceeded.

**CSRF:** Requests must include an `Origin` or `Referer` header matching `NEXT_PUBLIC_APP_URL`, `VERCEL_URL`, or localhost. Returns `403` on mismatch.

**Body:**

```json
{
  "category": "report",
  "message": "This pasco contains incorrect answers"
}
```

| Field      | Type   | Required | Description                                    |
| ---------- | ------ | -------- | ---------------------------------------------- |
| `category` | string | Yes      | `general`, `bug`, `feature`, `report`, `other` |
| `message`  | string | Yes      | Feedback text (1–10000 characters)             |

**Response `201`:** `{ "feedback": { ... } }`

**Response `429`:** `{ "error": "Too many requests", "retryAfterSeconds": 42 }`

## List feedback (moderation)

### `GET /api/feedback`

List feedback submissions. **Auth:** Moderator or admin

**Query parameters:**

| Param  | Type    | Default | Description                 |
| ------ | ------- | ------- | --------------------------- |
| `page` | integer | 1       | Page number (≥ 1)           |
| `limit`| integer | 20      | Page size (1–100)           |

**Response `200`:** `{ "feedback": [...], "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 } }`

Each feedback entry includes:

```json
{
  "id": "clx...",
  "userId": "user_...",
  "category": "report",
  "message": "...",
  "isRead": false,
  "createdAt": "..."
}
```

## Mark feedback read

### `PATCH /api/feedback/:id`

Mark a single feedback submission as read. **Auth:** Moderator or admin

**Response `200`:** `{ "feedback": { ... } }`

## Delete feedback

### `DELETE /api/feedback/:id`

Delete a feedback submission. **Auth:** Moderator or admin

**Response `200`:** `{ "success": true }`
