
-- Add content, meta_title, meta_description columns to pages table
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS content text DEFAULT '';
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_title text DEFAULT NULL;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS meta_description text DEFAULT NULL;
