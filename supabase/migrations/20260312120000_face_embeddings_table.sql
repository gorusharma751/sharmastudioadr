-- Migration: create face_embeddings table
-- Replaces MongoDB Atlas as the storage backend for AI face-matching feature.
-- The Python API on Render reads/writes this table via Supabase REST API
-- using the service role key (bypasses RLS).

CREATE TABLE IF NOT EXISTS face_embeddings (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id   text        NOT NULL,
  filename   text,
  file_id    text,
  photo_url  text,
  embedding  jsonb       NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_face_embeddings_event_id
  ON face_embeddings (event_id);

-- Enable RLS so the anon / authenticated keys cannot access embeddings
-- directly from client-side code. The Python API uses the service role key
-- which always bypasses RLS.
ALTER TABLE face_embeddings ENABLE ROW LEVEL SECURITY;
