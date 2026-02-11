
-- Album leads table for lead capture before viewing album
CREATE TABLE public.album_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  program_album_id uuid NOT NULL REFERENCES public.program_albums(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.album_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create album leads" ON public.album_leads
FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM studios WHERE id = album_leads.studio_id AND is_active = true)
);

CREATE POLICY "Studio members can manage own leads" ON public.album_leads
FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "Super admins can manage all leads" ON public.album_leads
FOR ALL USING (is_super_admin());

-- Album settings table for branding, lead form config, music etc.
CREATE TABLE public.album_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  watermark_enabled boolean DEFAULT true,
  watermark_position text DEFAULT 'bottom-right',
  music_url text,
  lead_form_enabled boolean DEFAULT true,
  lead_form_heading text DEFAULT 'Enter your details to view the album',
  lead_form_button_text text DEFAULT 'View Album',
  lead_form_fields jsonb DEFAULT '["name","phone"]'::jsonb,
  footer_text text DEFAULT 'Powered by StudioSaaS',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(studio_id)
);

ALTER TABLE public.album_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view album settings" ON public.album_settings
FOR SELECT USING (
  EXISTS (SELECT 1 FROM studios WHERE id = album_settings.studio_id AND is_active = true)
);

CREATE POLICY "Studio members can manage own album settings" ON public.album_settings
FOR ALL USING (is_studio_member(studio_id));

CREATE POLICY "Super admins can manage all album settings" ON public.album_settings
FOR ALL USING (is_super_admin());

-- Add slug and cover_image_url to program_albums
ALTER TABLE public.program_albums ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.program_albums ADD COLUMN IF NOT EXISTS cover_image_url text;
ALTER TABLE public.program_albums ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE public.program_albums ADD COLUMN IF NOT EXISTS music_url text;

-- Create unique index on slug per studio
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_albums_studio_slug ON public.program_albums(studio_id, slug);
