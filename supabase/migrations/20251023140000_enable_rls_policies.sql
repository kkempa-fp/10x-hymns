-- Migration: Reinstate RLS policies for hymns data
-- Purpose: Re-enable row level security enforcement after previous disablement
-- Affected tables: public.hymns, public.sets, public.ratings
-- Special considerations:
--   - Ensures collections (sets) table enforces CRUD policies for authenticated users
--   - Relies on existing Supabase auth context (auth.uid()) for ownership checks
--   - Policies remain granular per operation for clearer auditing

-- =============================================================================
-- RE-ENABLE ROW LEVEL SECURITY ON CORE TABLES
-- =============================================================================

-- Re-activate RLS enforcement for hymns inventory
alter table public.hymns enable row level security;

-- Re-activate RLS enforcement for user-owned collections
alter table public.sets enable row level security;

-- Re-activate RLS enforcement for ratings feedback
alter table public.ratings enable row level security;

-- =============================================================================
-- REFRESH COLLECTION (SETS) POLICIES FOR CRUD OPERATIONS
-- =============================================================================

-- Drop legacy policies to avoid duplication when recreating them
drop policy if exists sets_select_own on public.sets;
drop policy if exists sets_insert_own on public.sets;
drop policy if exists sets_update_own on public.sets;
drop policy if exists sets_delete_own on public.sets;

-- Allow authenticated users to read only their own collections
create policy sets_select_own on public.sets
    for select
    to authenticated
    using (auth.uid() = user_id);

-- Allow authenticated users to create collections tied to their identity
create policy sets_insert_own on public.sets
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- Allow authenticated users to update only their own collections
create policy sets_update_own on public.sets
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- Allow authenticated users to delete only their own collections
create policy sets_delete_own on public.sets
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- =============================================================================
-- RESTORE HYMNS AND RATINGS POLICIES
-- =============================================================================

drop policy if exists hymns_select_anon on public.hymns;

create policy hymns_select_anon on public.hymns
    for select
    to anon
    using (true);

drop policy if exists hymns_select_authenticated on public.hymns;

create policy hymns_select_authenticated on public.hymns
    for select
    to authenticated
    using (true);

drop policy if exists ratings_insert_anon on public.ratings;

create policy ratings_insert_anon on public.ratings
    for insert
    to anon
    with check (true);

drop policy if exists ratings_insert_authenticated on public.ratings;

create policy ratings_insert_authenticated on public.ratings
    for insert
    to authenticated
    with check (true);

drop policy if exists ratings_select_own on public.ratings;

create policy ratings_select_own on public.ratings
    for select
    to authenticated
    using (auth.uid() = user_id);

drop policy if exists ratings_update_own on public.ratings;

create policy ratings_update_own on public.ratings
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists ratings_delete_own on public.ratings;

create policy ratings_delete_own on public.ratings
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary:
-- - Re-enabled RLS on hymns, sets, and ratings tables
-- - Recreated granular CRUD policies for collections owned by authenticated users
-- - Ensured hymn catalog and ratings flows retain prior access rules while enforcing RLS
