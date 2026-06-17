# Documentation

Index of all documentation for Uni Pasco Hub.

## Getting started

| Doc                                      | Description                                 |
| ---------------------------------------- | ------------------------------------------- |
| [../README.md](../README.md)             | Project overview, quick start, scripts      |
| [development.md](development.md)         | Local setup, prerequisites, troubleshooting |
| [../.env.example](../.env.example)       | Environment variable reference              |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Contributor guide and doc maintenance rules |
| [../CHANGELOG.md](../CHANGELOG.md)       | Release history                             |

## Architecture and design

| Doc                                    | Description                                     |
| -------------------------------------- | ----------------------------------------------- |
| [architecture.md](architecture.md)     | System overview, folder structure, request flow |
| [features.md](features.md)             | Implemented features vs planned work            |
| [authentication.md](authentication.md) | Clerk integration, roles, permission matrix     |
| [data-model.md](data-model.md)         | Database schema, enums, indexes                 |

## API reference

| Doc                              | Description                            |
| -------------------------------- | -------------------------------------- |
| [api/README.md](api/README.md)   | API conventions and error codes        |
| [api/catalog.md](api/catalog.md) | Institutions, programs, courses        |
| [api/pascos.md](api/pascos.md)   | Pasco CRUD, engagement, file endpoints |
| [api/users.md](api/users.md)     | User profile and role management       |
| [api/admin.md](api/admin.md)     | Orphan cleanup and storage logs        |

## Guides

| Doc                                | Description                                           |
| ---------------------------------- | ----------------------------------------------------- |
| [file-uploads.md](file-uploads.md) | Upload pipeline, duplicates, Cloudinary folders       |
| [frontend.md](frontend.md)         | Pages, components, hooks, UI gaps                     |
| [operations.md](operations.md)     | Orphan cleanup CLI, rate limits, production checklist |

## Source of truth

| Topic              | Canonical location                                              |
| ------------------ | --------------------------------------------------------------- |
| Database schema    | [`prisma/schema.prisma`](../prisma/schema.prisma)               |
| API types          | [`src/types/api/`](../src/types/api/)                           |
| Env vars           | [`.env.example`](../.env.example)                               |
| Allowed file types | [`src/lib/pasco-file-types.ts`](../src/lib/pasco-file-types.ts) |
