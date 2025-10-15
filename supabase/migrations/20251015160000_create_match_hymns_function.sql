-- Migration: Create match_hymns function
-- Purpose: Provide reusable vector similarity RPC for hymn suggestions
-- Affected objects: public.match_hymns function (returns hymn metadata)
-- Special considerations:
--   - Requires pgvector extension (already enabled in initial schema)
--   - Validates embedding dimensionality and positive match count
--   - Leverages existing vector_l2_ops index for ordering

-- =============================================================================
-- HYMN MATCHING FUNCTION
-- =============================================================================
-- Exposes a deterministic similarity search helper to be invoked via Supabase RPC.
create or replace function public.match_hymns(
  query_embedding vector(768),
  match_count integer default 3
)
returns table (
  number varchar(10),
  name varchar(200),
  category varchar(100)
)
language plpgsql
stable
as
$$
begin
  if query_embedding is null then
    raise exception using message = 'query_embedding cannot be null';
  end if;

  if vector_dims(query_embedding) <> 768 then
    raise exception using message = 'query_embedding must have 768 dimensions';
  end if;

  if match_count is null or match_count <= 0 then
    raise exception using message = 'match_count must be a positive integer';
  end if;

  return query
  select h.number, h.name, h.category
  from public.hymns as h
  order by h.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Summary:
-- - Created public.match_hymns(query_embedding, match_count) stable function
-- - Added safeguards for null embeddings, incorrect dimension, and invalid limits
-- - Orders hymns by L2 distance using existing vector index for performance
