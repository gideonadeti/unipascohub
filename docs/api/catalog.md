# Catalog API

Institutions, programs, and courses. Read endpoints are public; mutations require `ADMIN`.

Types: [`src/types/api/catalog.ts`](../../src/types/api/catalog.ts)

## Institutions

### `GET /api/institutions`

List all institutions.

**Auth:** None

**Response `200`:**

```json
{
  "institutions": [
    {
      "id": "clx...",
      "name": "University of Cape Coast",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### `POST /api/institutions`

Create an institution.

**Auth:** Admin

**Body:**

```json
{ "name": "University of Cape Coast" }
```

**Response `201`:** `{ "institution": { ... } }`

**Errors:** `409` if name already exists

---

### `GET /api/institutions/:institutionId`

Get one institution.

**Auth:** None

**Response `200`:** `{ "institution": { ... } }`

---

### `PATCH /api/institutions/:institutionId`

Update an institution.

**Auth:** Admin

**Body:** `{ "name": "New Name" }`

**Response `200`:** `{ "institution": { ... } }`

---

### `DELETE /api/institutions/:institutionId`

Delete an institution.

**Auth:** Admin

**Response `200`:** `{ "success": true }`

**Errors:** `409` if institution has dependent programs or courses

## Programs

### `GET /api/programs`

List programs.

**Auth:** None

**Query parameters:**

| Param           | Type   | Description           |
| --------------- | ------ | --------------------- |
| `institutionId` | string | Filter by institution |

**Response `200`:**

```json
{
  "programs": [
    {
      "id": "clx...",
      "institutionId": "clx...",
      "name": "Computer Science",
      "type": "BACHELOR",
      "label": "Computer Science (Bachelor)",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

`label` disambiguates programs with the same name but different `ProgramType`.

`ProgramType`: `BACHELOR` | `BTECH` | `BTECH_TOP_UP` | `HND` | `DIPLOMA`

---

### `POST /api/programs`

Create a program.

**Auth:** Admin

**Body:**

```json
{
  "institutionId": "clx...",
  "name": "Computer Science",
  "type": "BACHELOR"
}
```

**Response `201`:** `{ "program": { ... } }`

---

### `GET /api/programs/:programId`

**Auth:** None

**Response `200`:** `{ "program": { ... } }`

---

### `PATCH /api/programs/:programId`

**Auth:** Admin

**Body:** `{ "name"?: string, "type"?: ProgramType }`

**Response `200`:** `{ "program": { ... } }`

---

### `DELETE /api/programs/:programId`

**Auth:** Admin

**Response `200`:** `{ "success": true }`

## Courses

### `GET /api/courses`

List courses.

**Auth:** None

**Query parameters:**

| Param           | Type   | Description           |
| --------------- | ------ | --------------------- |
| `institutionId` | string | Filter by institution |
| `programId`     | string | Filter by program     |

**Response `200`:**

```json
{
  "courses": [
    {
      "id": "clx...",
      "institutionId": "clx...",
      "code": "DCIT 101",
      "title": "Introduction to Computing",
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

---

### `POST /api/courses`

Create a course.

**Auth:** Admin

**Body:**

```json
{
  "institutionId": "clx...",
  "code": "DCIT 101",
  "title": "Introduction to Computing",
  "programIds": ["clx..."]
}
```

`programIds` links the course to one or more programs (many-to-many).

**Response `201`:** `{ "course": { ... } }`

---

### `GET /api/courses/:courseId`

Get course with linked program IDs.

**Auth:** None

**Response `200`:**

```json
{
  "course": {
    "id": "clx...",
    "institutionId": "clx...",
    "code": "DCIT 101",
    "title": "Introduction to Computing",
    "programIds": ["clx..."],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

### `PATCH /api/courses/:courseId`

**Auth:** Admin

**Body:** `{ "code"?: string, "title"?: string, "programIds"?: string[] }`

**Response `200`:** `{ "course": { ... } }`

---

### `DELETE /api/courses/:courseId`

**Auth:** Admin

**Response `200`:** `{ "success": true }`

**Errors:** `409` if course has pascos
