-- Migration: Create hymns system schema
-- Purpose: Initialize database schema for 10x-hymns application
-- Affected tables: hymns, sets, ratings
-- Special considerations: 
--   - Requires pgvector extension for embeddings
--   - Implements RLS for user data security
--   - Uses trigram indexes for fuzzy text search
--   - Includes automatic timestamp updates via triggers

-- Enable required extensions
create extension if not exists vector;
create extension if not exists pg_trgm;
create extension if not exists pgcrypto;

-- =============================================================================
-- HYMNS TABLE
-- =============================================================================
-- Primary table storing hymn data with vector embeddings for semantic search
create table public.hymns (
    id uuid primary key default gen_random_uuid(),
    number varchar(10) not null unique,
    category varchar(100) not null,
    name varchar(200) not null,
    text text not null,
    embedding vector(768) not null
);

-- Enable RLS for hymns table (public read-only access)
alter table public.hymns enable row level security;

-- RLS Policy: Allow anonymous users to select hymns (public read access)
create policy hymns_select_anon on public.hymns
    for select
    to anon
    using (true);

-- RLS Policy: Allow authenticated users to select hymns (public read access)
create policy hymns_select_authenticated on public.hymns
    for select
    to authenticated
    using (true);

-- Create IVFFlat index for vector similarity search on embeddings
create index hymns_embedding_idx on public.hymns 
    using ivfflat (embedding vector_l2_ops) with (lists = 100);

-- Create trigram index for fuzzy text search on hymn names
create index hymns_name_trgm_idx on public.hymns 
    using gin (name gin_trgm_ops);

-- =============================================================================
-- SETS TABLE
-- =============================================================================
-- Table storing user-created hymn sets for liturgical services
create table public.sets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    name varchar(200) not null,
    entrance varchar(200) not null default '',
    offertory varchar(200) not null default '',
    communion varchar(200) not null default '',
    adoration varchar(200) not null default '',
    recessional varchar(200) not null default '',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable RLS for sets table (user-owned data)
alter table public.sets enable row level security;

-- RLS Policy: Users can only select their own sets
create policy sets_select_own on public.sets
    for select
    to authenticated
    using (auth.uid() = user_id);

-- RLS Policy: Users can only insert sets with their own user_id
create policy sets_insert_own on public.sets
    for insert
    to authenticated
    with check (auth.uid() = user_id);

-- RLS Policy: Users can only update their own sets
create policy sets_update_own on public.sets
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own sets
create policy sets_delete_own on public.sets
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create unique index ensuring case-insensitive unique set names per user
create unique index sets_user_name_ci_idx on public.sets (user_id, lower(name));

-- Create trigram index for fuzzy text search on set names
create index sets_name_trgm_idx on public.sets 
    using gin (name gin_trgm_ops);

-- =============================================================================
-- AUTOMATIC TIMESTAMP UPDATE TRIGGER FOR SETS
-- =============================================================================
-- Function to automatically update the updated_at timestamp
create or replace function public.sets_touch_updated_at()
returns trigger as $$
begin
    new.updated_at := now();
    return new;
end;
$$ language plpgsql;

-- Trigger to automatically update updated_at on any row modification
create trigger sets_touch_updated_at
    before update on public.sets
    for each row
    execute function public.sets_touch_updated_at();

-- =============================================================================
-- RATINGS TABLE
-- =============================================================================
-- Table storing user ratings for hymn recommendations
-- Note: proposed_hymn_numbers stored as array without FK constraints per MVP design
create table public.ratings (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete set null,
    proposed_hymn_numbers integer[] not null default '{}',
    rating text not null check (rating in ('up', 'down')),
    created_at timestamptz not null default now(),
    client_fingerprint text not null
);

-- Enable RLS for ratings table (mixed anonymous/authenticated access)
alter table public.ratings enable row level security;

-- RLS Policy: Allow anonymous users to insert ratings (for guest feedback)
create policy ratings_insert_anon on public.ratings
    for insert
    to anon
    with check (true);

-- RLS Policy: Allow authenticated users to insert ratings
create policy ratings_insert_authenticated on public.ratings
    for insert
    to authenticated
    with check (true);

-- RLS Policy: Users can only select their own ratings
create policy ratings_select_own on public.ratings
    for select
    to authenticated
    using (auth.uid() = user_id);

-- RLS Policy: Users can only update their own ratings
create policy ratings_update_own on public.ratings
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- RLS Policy: Users can only delete their own ratings
create policy ratings_delete_own on public.ratings
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- Create index on user_id for efficient user-specific rating queries
create index ratings_user_idx on public.ratings (user_id);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary:
-- - Created hymns table with vector embeddings and public read access
-- - Created sets table with user ownership and automatic timestamp updates
-- - Created ratings table with mixed anonymous/authenticated access
-- - Implemented comprehensive RLS policies for data security
-- - Added performance indexes for vector search, text search, and user queries
-- - Enabled required PostgreSQL extensions (pgvector, pg_trgm, pgcrypto)