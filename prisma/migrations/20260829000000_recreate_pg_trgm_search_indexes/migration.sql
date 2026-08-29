-- Recreate trigram search indexes that were dropped by migration
-- 20260618132845_add_search_query_analytics. Prisma's schema cannot express
-- trigram (gin_trgm_ops) indexes, so subsequent `prisma migrate dev` diffs
-- emit DROP INDEX statements for them.
--
-- Guard: when running `prisma migrate dev`, prefer `--create-only` and review
-- the generated SQL — remove any spurious `DROP INDEX *_trgm_idx` lines
-- before applying. See docs/development.md.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS course_code_trgm_idx
  ON "Course" USING gin (code gin_trgm_ops);

CREATE INDEX IF NOT EXISTS course_title_trgm_idx
  ON "Course" USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS institution_name_trgm_idx
  ON "Institution" USING gin (name gin_trgm_ops);
