-- Migration: Refactor sets table to single content field
-- Purpose: Replace five thematic fields with one text field for hymn set content
-- Affected table: sets
-- Special considerations:
--   - No data migration from old fields to new field (assumes not needed for MVP)
--   - Keeps trigger for updated_at unchanged
--   - No changes to RLS policies

-- =============================================================================
-- ALTER SETS TABLE: REMOVE THEMATIC FIELDS, ADD CONTENT FIELD
-- =============================================================================

alter table public.sets
    drop column if exists entrance,
    drop column if exists offertory,
    drop column if exists communion,
    drop column if exists adoration,
    drop column if exists recessional;

alter table public.sets
    add column if not exists content text not null default '';

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary:
-- - Removed five thematic columns from public.sets
-- - Added single text column 'content' to public.sets
