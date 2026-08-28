-- Run once against your Postgres database:
--   psql "$DATABASE_URL" -f schema.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_chunks (
  id BIGSERIAL PRIMARY KEY,
  source_id TEXT NOT NULL,          -- matches `id` in sources.js
  source_type TEXT NOT NULL,        -- 'url' | 'file'
  source_value TEXT NOT NULL,       -- the URL or file path
  title TEXT,
  chunk_index INT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1024) NOT NULL,  -- voyage-3 embeddings are 1024-dim
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Speeds up similarity search once you have a meaningful amount of data
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS document_chunks_source_id_idx
  ON document_chunks (source_id);
