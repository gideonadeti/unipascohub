# Contributing

Thanks for contributing to Uni Pasco Hub. This guide covers setup, code standards, and documentation maintenance.

## Getting started

1. Read [docs/development.md](docs/development.md) for local setup
2. Copy [`.env.example`](.env.example) to `.env` and configure services
3. Run `pnpm install`, `pnpm prisma migrate dev`, `pnpm dev`

## Development workflow

```bash
pnpm dev          # Start dev server
pnpm lint         # Biome checks
pnpm format       # Auto-format
pnpm typecheck    # TypeScript
pnpm build        # Production build
```

Run lint, typecheck, and build before opening a pull request. CI runs the same checks on every PR to `main`.

## Code conventions

- **Formatter/linter:** [Biome](https://biomejs.dev/) — run `pnpm lint` and `pnpm format`
- **Types:** strict TypeScript; shared API types in `src/types/api/`
- **Server logic:** keep business rules in `src/lib/`, not in route handlers
- **Client data:** TanStack Query hooks in `src/hooks/api/` with API wrappers in `src/lib/api/`
- **Forms:** Zod schemas in `src/lib/schemas/` with react-hook-form
- **UI:** reuse shadcn components from `src/components/ui/`; match existing patterns in domain components
- **Prisma:** follow schema conventions (both relation sides, timestamps, indexes) — see `prisma/schema.prisma`

Keep changes focused. Prefer extending existing functions over adding one-off helpers.

## Pull requests

1. Create a branch from `develop` (or `main`, depending on project flow)
2. Make focused changes with clear commit messages
3. Ensure CI passes: lint, typecheck, build
4. Update documentation if your change affects API, schema, env vars, or user-facing behavior (see below)
5. Open a PR with a summary and test plan

## Documentation maintenance

When you change the codebase, update the relevant docs:

| Change type            | Update                                             |
| ---------------------- | -------------------------------------------------- |
| New API route          | `docs/api/*.md`, optionally `docs/features.md`     |
| New env var            | `.env.example`, `docs/development.md`              |
| Schema migration       | `docs/data-model.md` if models or relations change |
| New user-facing page   | `docs/frontend.md`, `docs/features.md`             |
| UI pattern or rule     | `docs/frontend-standards.md`                       |
| Site links or branding | `src/config/site.ts`, `.env.example`               |
| Shipped feature        | `CHANGELOG.md` under `Unreleased`                  |
| Auth/permission change | `docs/authentication.md`                           |

Documentation index: [docs/README.md](docs/README.md)

## Database changes

```bash
# Edit prisma/schema.prisma, then:
pnpm prisma migrate dev --name describe_your_change
pnpm prisma generate
```

Never edit applied migration files. Update `docs/data-model.md` when the schema meaningfully changes.

## Questions

Open an issue or discussion on the repository for architectural questions before large changes.
