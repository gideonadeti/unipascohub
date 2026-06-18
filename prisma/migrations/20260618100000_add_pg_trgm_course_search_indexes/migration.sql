-- Enable trigram extension for fuzzy course and institution search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fuzzy match on course codes (e.g. DCIT 10l → DCIT 101)
CREATE INDEX IF NOT EXISTS course_code_trgm_idx
  ON "Course" USING gin (code gin_trgm_ops);

-- Fuzzy match on course titles
CREATE INDEX IF NOT EXISTS course_title_trgm_idx
  ON "Course" USING gin (title gin_trgm_ops);

-- Fuzzy match on institution names (e.g. Ghan → University of Ghana)
CREATE INDEX IF NOT EXISTS institution_name_trgm_idx
  ON "Institution" USING gin (name gin_trgm_ops);
