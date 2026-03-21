-- ============================================
-- FIX STUDIO CREATION RLS - COMPLETE SOLUTION
-- ============================================

-- STEP 1: Create/Update Helper Functions
-- ============================================

-- Check if user has super_admin role
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'super_admin'
    )
$$;

-- Check if user is studio owner
CREATE OR REPLACE FUNCTION public.is_studio_owner(_studio_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.studios
        WHERE id = _studio_id AND owner_id = auth.uid()
    )
$$;

-- Check if user is studio member (owner or admin)
CREATE OR REPLACE FUNCTION public.is_studio_member(_studio_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.is_studio_owner(_studio_id) OR EXISTS (
        SELECT 1 FROM public.studio_members
        WHERE studio_id = _studio_id AND user_id = auth.uid()
    )
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_studio_owner(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_studio_member(UUID) TO authenticated;

-- STEP 2: Clean Up Old Studios Policies
-- ============================================

DROP POLICY IF EXISTS "Super admins can insert studios" ON public.studios;
DROP POLICY IF EXISTS "Authenticated users can create studios" ON public.studios;
DROP POLICY IF EXISTS "Super admins can manage all studios" ON public.studios;
DROP POLICY IF EXISTS "Studio members can view own studio" ON public.studios;
DROP POLICY IF EXISTS "Public can view active studios" ON public.studios;
DROP POLICY IF EXISTS "Studio owners can update studios" ON public.studios;
DROP POLICY IF EXISTS "Anyone can view active studios" ON public.studios;
DROP POLICY IF EXISTS "Users can create studios as owner" ON public.studios;
DROP POLICY IF EXISTS "Studio owners can read own studio" ON public.studios;
DROP POLICY IF EXISTS "Studio owners can update own studio" ON public.studios;
DROP POLICY IF EXISTS "Anyone can view active public studios" ON public.studios;
DROP POLICY IF EXISTS "Owners can update their studios" ON public.studios;

-- STEP 3: Create Fresh Studios RLS Policies
-- ============================================

-- Super admin can do EVERYTHING on studios
CREATE POLICY "Super admins manage all studios" ON public.studios
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Users can create studios where they are the owner
CREATE POLICY "Users create own studios" ON public.studios
    FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

-- Studio owners can view their studio
CREATE POLICY "Owners view own studios" ON public.studios
    FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());

-- Studio owners can update their studio
CREATE POLICY "Owners update own studios" ON public.studios
    FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());

-- Public can view active public studios
CREATE POLICY "Public view active studios" ON public.studios
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true AND is_public = true);

-- STEP 4: Clean Up Old Studio Settings Policies
-- ============================================

DROP POLICY IF EXISTS "Super admins can manage all studio settings" ON public.studio_settings;
DROP POLICY IF EXISTS "Studio members can manage own settings" ON public.studio_settings;
DROP POLICY IF EXISTS "Public can view settings of public studios" ON public.studio_settings;
DROP POLICY IF EXISTS "Studio owners can manage settings" ON public.studio_settings;
DROP POLICY IF EXISTS "Studio owners manage settings" ON public.studio_settings;
DROP POLICY IF EXISTS "Studio members manage settings" ON public.studio_settings;
DROP POLICY IF EXISTS "Public view public studio settings" ON public.studio_settings;
DROP POLICY IF EXISTS "Anyone can view public settings" ON public.studio_settings;
DROP POLICY IF EXISTS "Public can view settings" ON public.studio_settings;

-- STEP 5: Create Fresh Studio Settings RLS Policies
-- ============================================

-- Super admin can do EVERYTHING on studio_settings
CREATE POLICY "Super admins manage all settings" ON public.studio_settings
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Studio owners can manage their settings
CREATE POLICY "Owners manage own settings" ON public.studio_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.studios
            WHERE id = studio_id AND owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.studios
            WHERE id = studio_id AND owner_id = auth.uid()
        )
    );

-- Public can view settings of public studios
CREATE POLICY "Public view public settings" ON public.studio_settings
    FOR SELECT
    TO anon, authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.studios
            WHERE id = studio_id AND is_active = true AND is_public = true
        )
    );

-- STEP 6: Clean Up Old User Roles Policies
-- ============================================

DROP POLICY IF EXISTS "Super admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;

-- STEP 7: Create Fresh User Roles RLS Policies
-- ============================================

-- Super admin can manage all roles
CREATE POLICY "Super admins manage roles" ON public.user_roles
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Users can view their own role
CREATE POLICY "Users view own role" ON public.user_roles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- STEP 8: Clean Up Old Studio Members Policies
-- ============================================

DROP POLICY IF EXISTS "Super admins can manage all members" ON public.studio_members;
DROP POLICY IF EXISTS "Studio owners can manage members" ON public.studio_members;
DROP POLICY IF EXISTS "Members can view own membership" ON public.studio_members;
DROP POLICY IF EXISTS "Owners manage studio members" ON public.studio_members;
DROP POLICY IF EXISTS "Members view own membership" ON public.studio_members;

-- STEP 9: Create Fresh Studio Members RLS Policies
-- ============================================

-- Super admin can manage all members
CREATE POLICY "Super admins manage members" ON public.studio_members
    FOR ALL
    TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- Studio owners can manage their members
CREATE POLICY "Owners manage members" ON public.studio_members
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.studios
            WHERE id = studio_id AND owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.studios
            WHERE id = studio_id AND owner_id = auth.uid()
        )
    );

-- Members can view their own membership
CREATE POLICY "Members view membership" ON public.studio_members
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- ============================================
-- VERIFY: Run these queries to check policies
-- ============================================

-- SELECT * FROM pg_policies WHERE tablename = 'studios';
-- SELECT * FROM pg_policies WHERE tablename = 'studio_settings';
-- SELECT * FROM pg_policies WHERE tablename = 'user_roles';
-- SELECT * FROM pg_policies WHERE tablename = 'studio_members';
