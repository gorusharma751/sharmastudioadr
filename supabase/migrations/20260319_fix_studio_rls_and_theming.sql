-- Fix RLS for studios table
-- Allow super admins to insert studios
CREATE POLICY "Super admins can insert studios" ON public.studios
    FOR INSERT WITH CHECK (public.is_super_admin());

-- Allow authenticated users to create studios (they become the owner)
CREATE POLICY "Authenticated users can create studios" ON public.studios
    FOR INSERT WITH CHECK (owner_id = auth.uid());

-- Add theme fields to studio_settings
ALTER TABLE public.studio_settings
  ADD COLUMN IF NOT EXISTS theme_type TEXT DEFAULT 'solid',
  ADD COLUMN IF NOT EXISTS gradient_angle INTEGER DEFAULT 45;

-- RLS policy for studio_settings
DROP POLICY IF EXISTS "Studio members can manage own settings" ON public.studio_settings;

CREATE POLICY "Super admins can manage all studio settings" ON public.studio_settings
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own settings" ON public.studio_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.studios
            WHERE id = studio_id AND public.is_studio_member(id)
        )
    );

CREATE POLICY "Public can view settings of public studios" ON public.studio_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.studios
            WHERE id = studio_id AND is_active = true AND is_public = true
        )
    );
