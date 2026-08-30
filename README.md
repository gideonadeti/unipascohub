# Uni Pasco Hub

Find and share past exam papers. Prepare with confidence. Contributors upload papers organized by institution, program, and course; anyone can browse, view, react, and download.

## Features

- **Academic catalog** — institutions, programs, and courses with admin-managed CRUD
- **Pasco management** — multi-file upload, edit, delete with metadata (year, level, semester, type)
- **File handling** — Cloudinary storage, content-hash duplicate detection, in-app PDF/image viewer, signed downloads
- **Engagement** — like/dislike reactions, view counting (deduped per viewer), download tracking
- **Auth & roles** — Clerk sign-in with `NORMAL_USER`, `CONTRIBUTOR`, `MODERATOR`, and `ADMIN` roles
- **Operations** — Cloudinary orphan cleanup (API + CLI), storage cleanup failure logging

The production homepage, `/pascos` browse page, and pasco create/detail/edit pages are implemented. See [docs/features.md](docs/features.md) for the full implemented vs planned breakdown.

## Tech stack

- [Next.js 16](https://nextjs.org/) · [React 19](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/)
- [Prisma 7](https://www.prisma.io/) + PostgreSQL
- [Clerk](https://clerk.com/) · [Cloudinary](https://cloudinary.com/) · [Redis](https://redis.io/) (optional)
- [TanStack Query](https://tanstack.com/query) · [shadcn/ui](https://ui.shadcn.com/) · [Tailwind CSS 4](https://tailwindcss.com/)
- [Biome](https://biomejs.dev/) · [pnpm](https://pnpm.io/)

## Quick start

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env — see docs/development.md for Clerk, Cloudinary, and Postgres setup

# 3. Start PostgreSQL + Redis (requires the password secret file)
mkdir -p secrets
echo "your-local-password" > secrets/postgres_password.txt
docker compose -f compose.yaml -f compose.local.yaml up -d
# Distributed rate limiting uses Upstash (see .env.example); locally the
# in-memory fallback is fine

# 4. Run migrations and generate Prisma client
pnpm prisma migrate dev
pnpm prisma generate

# 5. Seed catalog data
pnpm seed-institutions
pnpm seed-atu-programs
pnpm seed-atu-eee-courses

# 6. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The home page runs a basic API smoke test; try `/pascos/new` to upload (requires sign-in and contributor role).

## Scripts

| Command                           | Description                                                        |
| --------------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                        | Start Next.js development server                                   |
| `pnpm build`                      | Production build                                                   |
| `pnpm start`                      | Start production server                                            |
| `pnpm lint`                       | Run Biome checks                                                   |
| `pnpm format`                     | Format code with Biome                                             |
| `pnpm typecheck`                  | TypeScript type check                                              |
| `pnpm seed-institutions`          | Upsert Ghanaian institutions (from Wikipedia)                      |
| `pnpm seed-atu-programs`          | Upsert ATU programs                                                |
| `pnpm seed-atu-eee-courses`       | Upsert ATU EEE Level 100 Semester 1 courses                        |
| `pnpm db:deploy`                  | Production: `prisma migrate deploy` then all three seeds           |
| `pnpm vercel-build`               | Vercel build: `prisma generate` → `db:deploy` → `next build`       |
| `pnpm cleanup:cloudinary-orphans` | Scan/delete orphan Cloudinary assets (dry-run by default)          |

## Documentation

| Doc                                                      | Description                          |
| -------------------------------------------------------- | ------------------------------------ |
| [docs/README.md](docs/README.md)                         | Documentation index                  |
| [docs/development.md](docs/development.md)               | Local setup and troubleshooting      |
| [docs/architecture.md](docs/architecture.md)             | System overview and folder structure |
| [docs/features.md](docs/features.md)                     | Implemented features and roadmap     |
| [docs/authentication.md](docs/authentication.md)         | Clerk integration and role matrix    |
| [docs/data-model.md](docs/data-model.md)                 | Database schema guide                |
| [docs/api/](docs/api/)                                   | REST API reference                   |
| [docs/file-uploads.md](docs/file-uploads.md)             | Upload pipeline                      |
| [docs/frontend.md](docs/frontend.md)                     | UI pages and components              |
| [docs/frontend-standards.md](docs/frontend-standards.md) | UI/UX conventions and phase roadmap  |
| [docs/operations.md](docs/operations.md)                 | Admin ops and maintenance            |
| [SECURITY.md](SECURITY.md)                               | Security policy and vulnerability reporting |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)                 | Community code of conduct            |
| [CONTRIBUTING.md](CONTRIBUTING.md)                       | Contributor guide                    |
| [CHANGELOG.md](CHANGELOG.md)                             | Release history                      |

## License

[MIT](LICENSE) — Copyright (c) 2026 Gideon Adeti
