# Uni Pasco Hub

A platform for university students to share past exam papers (pascos) and prepare for exams. Contributors upload papers organized by institution, program, and course; anyone can browse, view, react, and download.

## Features

- **Academic catalog** — institutions, programs, and courses with admin-managed CRUD
- **Pasco management** — multi-file upload, edit, delete with metadata (year, level, semester, type)
- **File handling** — Cloudinary storage, content-hash duplicate detection, in-app PDF/image viewer, signed downloads
- **Engagement** — like/dislike reactions, view counting (deduped per viewer), download tracking
- **Auth & roles** — Clerk sign-in with `NORMAL_USER`, `CONTRIBUTOR`, `MODERATOR`, and `ADMIN` roles
- **Operations** — Cloudinary orphan cleanup (API + CLI), storage cleanup failure logging

The browse/discovery UI and a production homepage are planned next. See [docs/features.md](docs/features.md) for the full implemented vs planned breakdown.

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

# 3. Start PostgreSQL (requires secrets/postgres_password.txt — see docs/development.md)
docker compose up -d

# 4. Run migrations and generate Prisma client
pnpm prisma migrate dev
pnpm prisma generate

# 5. Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The home page runs a basic API smoke test; try `/pascos/new` to upload (requires sign-in and contributor role).

## Scripts

| Command                           | Description                                               |
| --------------------------------- | --------------------------------------------------------- |
| `pnpm dev`                        | Start Next.js development server                          |
| `pnpm build`                      | Production build                                          |
| `pnpm start`                      | Start production server                                   |
| `pnpm lint`                       | Run Biome checks                                          |
| `pnpm format`                     | Format code with Biome                                    |
| `pnpm typecheck`                  | TypeScript type check                                     |
| `pnpm cleanup:cloudinary-orphans` | Scan/delete orphan Cloudinary assets (dry-run by default) |

## Documentation

| Doc                                              | Description                          |
| ------------------------------------------------ | ------------------------------------ |
| [docs/README.md](docs/README.md)                 | Documentation index                  |
| [docs/development.md](docs/development.md)       | Local setup and troubleshooting      |
| [docs/architecture.md](docs/architecture.md)     | System overview and folder structure |
| [docs/features.md](docs/features.md)             | Implemented features and roadmap     |
| [docs/authentication.md](docs/authentication.md) | Clerk integration and role matrix    |
| [docs/data-model.md](docs/data-model.md)         | Database schema guide                |
| [docs/api/](docs/api/)                           | REST API reference                   |
| [docs/file-uploads.md](docs/file-uploads.md)     | Upload pipeline                      |
| [docs/frontend.md](docs/frontend.md)             | UI pages and components              |
| [docs/operations.md](docs/operations.md)         | Admin ops and maintenance            |
| [CONTRIBUTING.md](CONTRIBUTING.md)               | Contributor guide                    |
| [CHANGELOG.md](CHANGELOG.md)                     | Release history                      |

## License

[MIT](LICENSE) — Copyright (c) 2026 Gideon Adeti
