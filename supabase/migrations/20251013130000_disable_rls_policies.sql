-- Migration: Disable all RLS policies
-- Purpose: Disable Row Level Security for all tables in the hymns system
-- Affected tables: hymns, sets, ratings
-- Special considerations: 
--   - This migration removes all data access restrictions
--   - Use with caution in production environments
--   - Consider the security implications before applying

-- =============================================================================
-- DISABLE RLS POLICIES FOR HYMNS TABLE
-- =============================================================================

-- Disable RLS for hymns table (policies remain but are not enforced)
alter table public.hymns disable row level security;

-- =============================================================================
-- DISABLE RLS POLICIES FOR SETS TABLE
-- =============================================================================

-- Disable RLS for sets table (policies remain but are not enforced)
alter table public.sets disable row level security;

-- =============================================================================
-- DISABLE RLS POLICIES FOR RATINGS TABLE
-- =============================================================================

-- Disable RLS for ratings table (policies remain but are not enforced)
alter table public.ratings disable row level security;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary:
-- - Disabled RLS for hymns table (policies preserved but not enforced)
-- - Disabled RLS for sets table (policies preserved but not enforced)
-- - Disabled RLS for ratings table (policies preserved but not enforced)
-- - All policies remain in the database and can be re-enabled later
-- 
-- To re-enable RLS later, use:
-- ALTER TABLE public.hymns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.sets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;