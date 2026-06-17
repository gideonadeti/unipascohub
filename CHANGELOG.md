# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Frontend standards doc, site config module, Motion, shadcn `empty`/`skeleton`
- App shell: `SiteHeader`, `SiteFooter`, `ScrollToTop`, theme toggle (system/light/dark)
- Frontend Phase 2: layout primitives (`PageContainer`, `PageHeader`, `Section`), `PascoCard`, list skeletons, `PascoListSection`, `EmptyState`, `useCourse` hook, homepage recent-pascos preview
- Frontend Phase 3: stub pages for `/contributors`, `/sponsors`, `/privacy`, `/terms`, `/feedback` (footer links + credit link)
- Frontend Phase 4: production homepage with `HomeHero`, `HeroSearch` (v1 decorative), recent + popular `PascoListSection` blocks

### Planned

- Browse/discovery UI for pascos (`/pascos` with URL filters)
- Admin dashboard UI
- Database seed script
- Automated tests

## [0.1.0] - 2026-06-17

Initial documented baseline of implemented functionality.

### Added

#### Auth and users

- Clerk authentication (sign-in, sign-up, session management)
- User sync to PostgreSQL via webhooks and SSR fallback
- Role system: `NORMAL_USER`, `CONTRIBUTOR`, `MODERATOR`, `ADMIN`
- Self-service contributor upgrade
- Admin promote-to-moderator endpoint
- User profile (`GET/PATCH /api/users/me`)

#### Academic catalog

- Institutions, programs, and courses with admin CRUD
- Program type enum (`BACHELOR`, `BTECH`, `BTECH_TOP_UP`, `HND`, `DIPLOMA`)
- Course–program many-to-many relationship
- Program label disambiguation for same-name programs

#### Pasco lifecycle

- Create, read, update, delete pascos
- Multi-file uploads per pasco
- List with filters, pagination, and sorting
- Academic year validation (`YYYY/YYYY`)
- Incomplete upload flag (`isComplete`)
- Pasco types: `MID_SEM`, `END_OF_SEM`, `RESIT`

#### File handling

- Cloudinary signed widget upload flow
- Content-hash duplicate detection (SHA-256)
- Allowed types: PDF, images, documents (no spreadsheets)
- In-app PDF viewer and image viewer
- Signed URLs for view and download

#### Engagement

- Like/dislike reactions with toggle
- View counting (deduped per viewer)
- Download counting
- Viewer reaction included in list/detail when signed in

#### Admin and operations

- Cloudinary orphan asset cleanup (API + CLI)
- Storage cleanup run and failure logging
- Rate limiting with Redis support (in-memory fallback)

#### Frontend

- Pasco create, detail, and edit pages
- Contributor and edit permission gates
- TanStack Query data layer
- shadcn/ui component library
- Toast notifications
- API smoke test homepage (placeholder)

#### Infrastructure

- Next.js 16 App Router
- Prisma 7 with PostgreSQL
- Docker Compose for local Postgres
- GitHub Actions CI (lint, typecheck, build)
- Biome for linting and formatting

### Changed

- Renamed `student` role to `NORMAL_USER`
- Renamed `level` field to `educationLevel` on Pasco
- Course model scoped to institution with program M2M (migrated from program-only FK)

### Fixed

- Cloudinary orphan scan `next_cursor` null handling
- Cloudinary widget signing with source and widget timestamp
- Font variable consistency in globals.css

[Unreleased]: https://github.com/your-org/unipascohub/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/your-org/unipascohub/releases/tag/v0.1.0
