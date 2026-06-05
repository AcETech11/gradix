-- Gradix repair: remove legacy text-term checks from partially migrated databases.
-- Phase 2 uses public.school_term enum values: first, second, third.
-- Some older remote databases still have check_term_values constraints from a text-based schema.

alter table if exists public.result_uploads
  drop constraint if exists check_term_values;

alter table if exists public.results
  drop constraint if exists check_term_values;

alter table if exists public.code_term_access
  drop constraint if exists check_term_values;
