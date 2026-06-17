# Frontend

Current UI structure, conventions, and planned work.

**Standards:** All new UI work must follow [frontend-standards.md](frontend-standards.md). Site branding, links, and credits live in [`src/config/site.ts`](../src/config/site.ts).

## Phased roadmap

| Phase | Focus                                                   | Status  |
| ----- | ------------------------------------------------------- | ------- |
| 0     | Standards, `site.ts`, Motion, shadcn `empty`/`skeleton` | Done    |
| 1     | Theme, header, footer, favicon                          | Next    |
| 2     | Shared primitives, `PascoCard`, skeletons               | Planned |
| 3     | Stub pages (contributors, legal, feedback)              | Planned |
| 4     | Homepage                                                | Planned |
| 5     | Browse with URL filters                                 | Planned |
| 6–7   | Page alignment, polish                                  | Planned |

See [frontend-standards.md](frontend-standards.md) for full conventions.

## Pages

| Route                    | File                                                                                  | Renders                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `/`                      | [`src/app/page.tsx`](../src/app/page.tsx)                                             | [`ApiSmokeTest`](../src/components/api-smoke-test.tsx) — dev placeholder |
| `/pascos/new`            | [`src/app/pascos/new/page.tsx`](../src/app/pascos/new/page.tsx)                       | Create form behind contributor gate                                      |
| `/pascos/[pascoId]`      | [`src/app/pascos/[pascoId]/page.tsx`](../src/app/pascos/[pascoId]/page.tsx)           | Pasco detail                                                             |
| `/pascos/[pascoId]/edit` | [`src/app/pascos/[pascoId]/edit/page.tsx`](../src/app/pascos/[pascoId]/edit/page.tsx) | Edit form behind permission gate                                         |

Root layout: [`src/app/layout.tsx`](../src/app/layout.tsx) — Clerk provider, header with "Add pasco" link (signed-in), auth buttons, toast container.

## Component layers

```text
layout.tsx
├── EnsureUserSynced          # SSR user sync fallback
├── QueryProvider             # TanStack Query
├── header                    # Nav + auth
└── page content
    ├── *Gate components      # Auth/role checks
    ├── *Form components      # react-hook-form + Zod
    ├── domain components     # PascoDetail, EngagementBar, etc.
    └── ui/*                  # shadcn primitives
```

### Gate components

| Component         | File                                                               | Checks                       |
| ----------------- | ------------------------------------------------------------------ | ---------------------------- |
| `PascoCreateGate` | [`pasco-create-gate.tsx`](../src/components/pasco-create-gate.tsx) | Signed in + contributor role |
| `PascoEditGate`   | [`pasco-edit-gate.tsx`](../src/components/pasco-edit-gate.tsx)     | Signed in + can modify pasco |

### Domain components

| Component                           | Purpose                                          |
| ----------------------------------- | ------------------------------------------------ |
| `PascoDetail`                       | Detail view, metadata, files, engagement, delete |
| `PascoCreateForm` / `PascoEditForm` | Full pasco forms with catalog pickers            |
| `PascoCloudinaryUpload`             | File upload widget and validation                |
| `PascoEngagementBar`                | Like/dislike, view/download counts               |
| `PascoFileView`                     | Modal viewer for PDFs and images                 |
| `PascoEmbedPdfViewer`               | PDF embed using `@embedpdf/react-pdf-viewer`     |
| `PascoFileActions`                  | View/download buttons per file                   |
| `PascoDeleteDialog`                 | Delete confirmation                              |

### UI primitives

shadcn-style components in [`src/components/ui/`](../src/components/ui/): button, card, dialog, select, combobox, field, alert, spinner, empty, skeleton, etc.

## Data fetching

### API client

Axios instance with error handling: [`src/lib/api/client.ts`](../src/lib/api/client.ts)

Domain wrappers: [`src/lib/api/`](../src/lib/api/) — `pascos.ts`, `users.ts`, `institutions.ts`, `programs.ts`, `courses.ts`, `cloudinary.ts`, `pasco-engagement.ts`

### TanStack Query

| Hook file                                                             | Hooks                                                       |
| --------------------------------------------------------------------- | ----------------------------------------------------------- |
| [`use-pascos.ts`](../src/hooks/api/use-pascos.ts)                     | `usePascosList`, `usePasco`, create/update/delete mutations |
| [`use-pasco-engagement.ts`](../src/hooks/api/use-pasco-engagement.ts) | Reactions, views, file view/download                        |
| [`use-current-user.ts`](../src/hooks/api/use-current-user.ts)         | Current user profile                                        |
| [`use-institutions.ts`](../src/hooks/api/use-institutions.ts)         | Institution list                                            |
| [`use-programs.ts`](../src/hooks/api/use-programs.ts)                 | Program list                                                |
| [`use-courses.ts`](../src/hooks/api/use-courses.ts)                   | Course list                                                 |

Query keys: [`src/lib/api/query-keys.ts`](../src/lib/api/query-keys.ts)

Provider: [`src/components/providers/query-provider.tsx`](../src/components/providers/query-provider.tsx)

## Form validation

Zod schemas with react-hook-form:

| Schema                  | File                                                                    | Used by           |
| ----------------------- | ----------------------------------------------------------------------- | ----------------- |
| `pascoCreateFormSchema` | [`src/lib/schemas/pasco-create.ts`](../src/lib/schemas/pasco-create.ts) | `PascoCreateForm` |
| `pascoUpdate` parsing   | [`src/lib/schemas/pasco-update.ts`](../src/lib/schemas/pasco-update.ts) | `PascoEditForm`   |

## Styling

- Tailwind CSS 4 — [`src/app/globals.css`](../src/app/globals.css)
- Geist font via `next/font`
- `cn()` utility: [`src/lib/utils.ts`](../src/lib/utils.ts)
- Toast notifications via Sonner

## Known gaps (next UI phase)

These are the main frontend items not yet built:

1. **Browse page** — filtered pasco list using `usePascosList` with catalog filters
2. **Homepage** — replace `ApiSmokeTest` with landing/discovery experience
3. **Enriched display** — show course code/title instead of raw `courseId` on detail and cards
4. **Navigation** — logo/home link, breadcrumbs (institution → program → course)
5. **Admin dashboard** — UI for orphan cleanup and storage failure inspection
6. **Responsive polish** — mobile header, empty states, loading skeletons

See [features.md](features.md) for the full implemented vs planned breakdown.

## When you add a page, update this doc

Add a row to the Pages table and note any new components or hooks.
