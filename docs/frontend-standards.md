# Frontend Standards

Authoritative UI/UX conventions for Uni Pasco Hub. All new frontend work must follow this document.

**Related:** [frontend.md](frontend.md) (current implementation inventory) · [src/config/site.ts](../src/config/site.ts) (branding, links, credits)

---

## Stack

| Layer         | Primary                                                                | Fallback / enhancement                                                                        |
| ------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| UI primitives | [shadcn/ui](https://ui.shadcn.com/) (`radix-maia`, stone base)         | [Magic UI](https://magicui.design/docs/components) for marketing accents shadcn does not ship |
| Icons         | `lucide-react`                                                         | `react-icons` only when Lucide lacks the glyph                                                |
| Animation     | [Motion](https://motion.dev/docs/react) (`motion/react`)               | `tw-animate-css` for dialog enter/exit (already in project)                                   |
| Theming       | `next-themes` + CSS variables in [globals.css](../src/app/globals.css) | Default: **system**; user can pick light or dark                                              |
| Data          | TanStack Query hooks in `src/hooks/api/`                               | Never raw `fetch` in components                                                               |

Install new shadcn components via `pnpm dlx shadcn@latest add <name>`.

---

## App shell (Phase 1 target)

Every page shares one shell:

```text
SiteHeader
main (flex-1)
SiteFooter
Toaster
```

### Header

- **Left:** site name (`siteName` from config) linking to `/`
- **Right:** theme toggle, Clerk `UserButton` (or sign-in when signed out)
- **No primary nav links** in the header for v1 — use page CTAs and footer instead
- Sticky optional: `sticky top-0 z-50 border-b bg-background/95 backdrop-blur`
- Use design tokens only — no one-off colors (e.g. remove hardcoded purple Sign Up)

### Footer

- Brand tagline, scalable credit line via `getCreditLine()` from [site.ts](../src/config/site.ts)
- Grouped links from `footerNav` (product, legal, community)
- Social / Buy Me a Coffee links from `siteLinks` — render only when env URLs are set
- Scroll-to-top control (Phase 1)

---

## Component layers

```text
page.tsx (server)
└── *Page / *View (client, optional)
    ├── *Gate (auth only)
    ├── layout sections
    └── ui/* primitives
```

### Naming

| Pattern    | Example                                 | Rules                                               |
| ---------- | --------------------------------------- | --------------------------------------------------- |
| Domain     | `pasco-card.tsx`, `home-hero.tsx`       | May use hooks and API types                         |
| Gates      | `pasco-create-gate.tsx`                 | Auth/role checks only                               |
| Layout     | `site-header.tsx`, `page-container.tsx` | Shell and page wrappers                             |
| Primitives | `ui/button.tsx`                         | **Must not** import from `hooks/api/` or `lib/api/` |

---

## Layout width tiers

| Tier    | Max width   | Use for                    |
| ------- | ----------- | -------------------------- |
| Narrow  | `max-w-2xl` | Forms, detail views, gates |
| Default | `max-w-6xl` | Homepage, browse lists     |
| Wide    | `max-w-7xl` | Admin dashboards (future)  |

**Page wrapper:** `mx-auto w-full flex-1 px-4 py-6 sm:px-6`

**Vertical rhythm:** sections use `space-y-8` or `space-y-12`

---

## Typography

Use Geist (loaded in [layout.tsx](../src/app/layout.tsx)):

| Token   | Classes                                             | Use            |
| ------- | --------------------------------------------------- | -------------- |
| Display | `text-3xl sm:text-4xl font-bold tracking-tight`     | Hero headline  |
| H1      | `text-2xl sm:text-3xl font-semibold tracking-tight` | Page titles    |
| H2      | `text-xl font-semibold`                             | Section titles |
| H3      | `text-lg font-medium`                               | Card titles    |
| Body    | `text-sm sm:text-base`                              | Default copy   |
| Small   | `text-xs sm:text-sm text-muted-foreground`          | Meta, captions |

---

## UI states

Every data-driven section must handle loading, error, and empty.

| State          | Component                                           | When                                           |
| -------------- | --------------------------------------------------- | ---------------------------------------------- |
| Loading        | `Skeleton` (lists/cards), `Spinner` (inline/button) | Skeleton for grids; spinner for submit actions |
| Error          | `Alert variant="destructive"`                       | Section or block failed to load                |
| Mutation error | Sonner toast                                        | Create/update/delete failures                  |
| Empty          | shadcn `Empty` + CTA `Button`                       | No results                                     |

Prefer `PascoCardSkeleton` grid (Phase 2) over spinners for list loading.

---

## List and card standard (Phase 2 target)

`PascoCard` — shared by homepage and browse:

- Entire card is a `Link` to `/pascos/[id]` (large tap target on mobile)
- Badges: `type`, `educationLevel`, `semesterType`, `contentType` via `Badge`
- Meta row: views, downloads, likes with Lucide icons
- Grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4`

Until course names are enriched, use `academicYear` + level as the title fallback.

---

## Data fetching

- Use hooks from `src/hooks/api/` with `queryKeys` from [query-keys.ts](../src/lib/api/query-keys.ts)
- Browse page (Phase 5): filters in URL search params for shareable links
- Invalidate queries on mutation success — follow existing patterns in `use-pascos.ts`

---

## Search behavior

| Version       | Behavior                                                                               |
| ------------- | -------------------------------------------------------------------------------------- |
| **v1 (hero)** | Animated typing placeholder; submit shows toast or scrolls to list — **no search API** |
| **v2**        | Navigate to `/pascos?courseId=...&educationLevel=...` with URL-driven filters          |

Hero search input must have a static `aria-label` (e.g. `"Search pascos"`) regardless of animated placeholder.

---

## Theming

- Use semantic tokens: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`
- Buttons: shadcn `Button` variants (`default`, `outline`, `ghost`, `destructive`)
- Cards: `Card` for grouped content
- Badges: `Badge` for metadata chips
- Follow [shadcn theming](https://ui.shadcn.com/docs/theming) and [dark mode (Next.js)](https://ui.shadcn.com/docs/dark-mode/next)

---

## Animation

- **Motion** for hero typing, section reveals, scroll-to-top fade
- Always respect `prefers-reduced-motion` — skip or simplify animations when set
- **Magic UI** sparingly (one accent per page max)
- Do not animate every hover state

---

## Responsiveness

Mobile-first — most users are on phones.

| Breakpoint       | Notes                                           |
| ---------------- | ----------------------------------------------- |
| default (<640px) | Single column, full-width cards, stacked footer |
| `sm`             | 2-column card grid                              |
| `md`             | Footer columns                                  |
| `lg`             | 3-column card grid, wider hero                  |

Minimum tap target: ~44px height for primary actions.

---

## Accessibility

- Interactive elements are `Button` or `Link`, not styled `<div>`
- Focus visible on all controls (shadcn defaults)
- Link cards: entire card is one focusable link
- Images and icons decorative unless they convey meaning (`aria-hidden` when decorative)
- Loading: provide text for screen readers where spinners are used alone

---

## Credits and site config

All branding, footer links, hero copy, and social URLs live in [src/config/site.ts](../src/config/site.ts).

```ts
siteCredits.lead          // "Gideon Adeti"
siteCredits.contributors  // grows over time
getCreditLine()           // scalable footer string
siteLinks                 // from NEXT_PUBLIC_* env vars
footerNav                 // grouped footer links
heroSearchExamples        // typing animation strings
```

Contributors page (`/contributors`, Phase 3) reads from `siteCredits`.

---

## Label formatting

Always use `formatEnumLabel` from [catalog-labels.ts](../src/lib/catalog-labels.ts) for enum display. Do not duplicate local formatters (e.g. remove `formatLabel` in `pasco-detail.tsx` in Phase 2).

---

## Phase roadmap

| Phase | Deliverables                                                              | Status  |
| ----- | ------------------------------------------------------------------------- | ------- |
| **0** | Standards doc, `site.ts`, Motion, shadcn `empty`/`skeleton`, env docs     | Done    |
| **1** | ThemeProvider, `SiteHeader`, `SiteFooter`, favicon, remove purple Sign Up | Done    |
| **2** | `PageContainer`, `PascoCard`, skeletons, `formatEnumLabel` fix            | Done    |
| **3** | Stub pages: contributors, sponsors, privacy, terms, feedback              | Done    |
| **4** | Homepage: hero, search UI, recent/popular sections                        | Done    |
| **5** | Browse page with URL filters                                              | Done    |
| **6** | Align existing pasco pages to new shell                                   | Planned |
| **7** | A11y polish, docs update                                                  | Planned |

---

## When you change the UI, update

| Change                 | Update                                                            |
| ---------------------- | ----------------------------------------------------------------- |
| New UI pattern or rule | This file                                                         |
| Site links or copy     | [site.ts](../src/config/site.ts), [.env.example](../.env.example) |
| New page or component  | [frontend.md](frontend.md)                                        |
| Shipped feature        | [CHANGELOG.md](../CHANGELOG.md)                                   |
