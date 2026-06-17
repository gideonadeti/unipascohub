# Users API

Current user profile and role management.

Types: [`src/types/api/users.ts`](../../src/types/api/users.ts)

## Current user

### `GET /api/users/me`

Get the signed-in user's profile.

**Auth:** Signed in

**Response `200`:**

```json
{
  "user": {
    "id": "user_...",
    "name": "Jane Doe",
    "school": "University of Cape Coast",
    "role": "CONTRIBUTOR"
  }
}
```

`role`: `NORMAL_USER` | `CONTRIBUTOR` | `MODERATOR` | `ADMIN`

**Errors:** `404` if user not synced to database yet

---

### `PATCH /api/users/me`

Update profile fields.

**Auth:** Signed in

**Body:**

```json
{ "school": "University of Cape Coast" }
```

**Response `200`:** `{ "user": { ... } }`

## Role changes

### `POST /api/users/upgrade-to-contributor`

Self-upgrade from `NORMAL_USER` to `CONTRIBUTOR`.

**Auth:** Signed in

**Body:** None

**Response `200`:**

```json
{
  "user": {
    "id": "user_...",
    "role": "CONTRIBUTOR"
  }
}
```

**Errors:**

- `409` if already a contributor (or higher role)
- `403` if upgrade is not allowed for this user

---

### `POST /api/users/:userId/promote-to-moderator`

Promote a user to `MODERATOR`.

**Auth:** Admin

**Body:** None

**Response `200`:**

```json
{
  "user": {
    "id": "user_...",
    "role": "MODERATOR"
  }
}
```

**Errors:** `404` user not found, `403` not admin, `409` if already moderator or admin

## Webhook (not a client API)

User creation and updates are also handled by `POST /api/webhooks` (Clerk webhook). See [authentication.md](../authentication.md).

There is no API endpoint to promote users to `ADMIN`; set the role directly in the database.
