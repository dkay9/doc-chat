-- ============================================
-- PHASE 1: Vector Store Setup
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- 1. Enable the pgvector extension
create extension if not exists vector with schema extensions;


-- 2. Documents table
create table documents (
  id bigint primary key generated always as identity,
  name text not null,
  mime_type text not null default 'application/pdf',
  file_size integer,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);


-- 3. Document chunks table (1536 = text-embedding-3-small dimensions)
create table document_chunks (
  id bigint primary key generated always as identity,
  document_id bigint not null references documents(id) on delete cascade,
  content text not null,
  chunk_index integer not null,
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);


-- 4. Indexes
create index on document_chunks
  using hnsw (embedding vector_cosine_ops);

create index on document_chunks (document_id);


-- 5. RPC function for similarity search
create or replace function match_document_chunks (
  query_embedding vector(1536),
  match_count int default 5,
  match_threshold float default 0.5
)
returns table (
  id bigint,
  document_id bigint,
  content text,
  chunk_index integer,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.content,
    dc.chunk_index,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where 1 - (dc.embedding <=> query_embedding) > match_threshold
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
