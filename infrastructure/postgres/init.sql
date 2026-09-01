CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL,
  summary TEXT,
  photo_path TEXT,
  pdf_path TEXT,
  skills TEXT[],
  education JSONB,
  experience JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE cvs ADD COLUMN IF NOT EXISTS summary TEXT;

CREATE TABLE IF NOT EXISTS cv_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cv_id UUID REFERENCES cvs(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding vector(3072),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cv_embeddings_embedding_idx ON cv_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);
