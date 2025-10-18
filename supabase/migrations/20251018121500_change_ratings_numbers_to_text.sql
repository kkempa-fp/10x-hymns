-- Migration: Align ratings hymn numbers with hymns.number text type
-- Purpose: Store hymn numbers exactly as provided instead of coercing to integers
-- Affected table: ratings
-- Special considerations:
--   - Existing integer values are cast to text[] in-place
--   - No changes to RLS policies or dependent functions

-- =============================================================================
-- ALTER RATINGS TABLE: SWITCH PROPOSED NUMBERS TO TEXT[]
-- =============================================================================

alter table public.ratings
  alter column proposed_hymn_numbers type text[]
  using proposed_hymn_numbers::text[];

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary:
-- - Converted ratings.proposed_hymn_numbers from integer[] to text[]
-- - Preserved historic data via explicit cast
