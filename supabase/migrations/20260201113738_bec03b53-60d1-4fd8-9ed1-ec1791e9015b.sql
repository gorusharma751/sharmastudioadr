-- ============================================
-- MULTI-TENANT PHOTOGRAPHY STUDIO SAAS PLATFORM
-- ============================================

-- 1. Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'studio_admin');

-- 2. User roles table (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. SaaS Plans table (Super Admin only)
CREATE TABLE public.saas_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    max_albums INTEGER DEFAULT 50,
    max_photos INTEGER DEFAULT 1000,
    max_bookings INTEGER DEFAULT 100,
    storage_limit_gb INTEGER DEFAULT 10,
    price DECIMAL(10,2) DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;

-- 4. Studios table (core multi-tenant table)
CREATE TABLE public.studios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    saas_plan_id UUID REFERENCES public.saas_plans(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    is_public BOOLEAN DEFAULT true,
    subdomain TEXT UNIQUE,
    custom_domain TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.studios ENABLE ROW LEVEL SECURITY;

-- 5. Studio settings table
CREATE TABLE public.studio_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#D4AF37',
    secondary_color TEXT DEFAULT '#1a1a2e',
    accent_color TEXT DEFAULT '#f5f5f5',
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    social_facebook TEXT,
    social_instagram TEXT,
    social_youtube TEXT,
    google_drive_folder TEXT,
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.studio_settings ENABLE ROW LEVEL SECURITY;

-- 6. Studio members (for studio admin assignments)
CREATE TABLE public.studio_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (studio_id, user_id)
);

ALTER TABLE public.studio_members ENABLE ROW LEVEL SECURITY;

-- 7. Services table
CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    images JSONB DEFAULT '[]'::jsonb,
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 8. Portfolio albums table
CREATE TABLE public.portfolio_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    cover_image_url TEXT,
    is_published BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_albums ENABLE ROW LEVEL SECURITY;

-- 9. Portfolio images table
CREATE TABLE public.portfolio_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    album_id UUID REFERENCES public.portfolio_albums(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;

-- 10. Bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    event_type TEXT,
    event_dates JSONB DEFAULT '[]'::jsonb,
    location TEXT,
    services_required JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 11. Program/Event albums table
CREATE TABLE public.program_albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    qr_code_url TEXT,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.program_albums ENABLE ROW LEVEL SECURITY;

-- 12. Program images table
CREATE TABLE public.program_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    program_album_id UUID REFERENCES public.program_albums(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.program_images ENABLE ROW LEVEL SECURITY;

-- 13. Pages table (dynamic pages)
CREATE TABLE public.pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    is_published BOOLEAN DEFAULT false,
    show_in_nav BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (studio_id, slug)
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- 14. Page sections table
CREATE TABLE public.page_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
    section_type TEXT NOT NULL DEFAULT 'text',
    content JSONB DEFAULT '{}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

-- 15. Wedding invitations table
CREATE TABLE public.wedding_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    bride_name TEXT NOT NULL,
    groom_name TEXT NOT NULL,
    event_date DATE,
    venue TEXT,
    message TEXT,
    template_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.wedding_invitations ENABLE ROW LEVEL SECURITY;

-- 16. Find your photos submissions
CREATE TABLE public.photo_search_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    studio_id UUID REFERENCES public.studios(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    selfie_url TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.photo_search_requests ENABLE ROW LEVEL SECURITY;

-- 17. Platform settings (Super Admin only)
CREATE TABLE public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform_name TEXT DEFAULT 'StudioSaaS',
    default_theme JSONB DEFAULT '{"primaryColor": "#D4AF37", "secondaryColor": "#1a1a2e"}'::jsonb,
    default_services JSONB DEFAULT '[]'::jsonb,
    default_pages JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Check if current user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'super_admin')
$$;

-- Check if current user is studio owner
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

-- Check if current user is studio member (owner or admin)
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

-- ============================================
-- RLS POLICIES
-- ============================================

-- User roles policies
CREATE POLICY "Super admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Users can view own role" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid());

-- SaaS plans policies
CREATE POLICY "Super admins can manage plans" ON public.saas_plans
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Anyone can view active plans" ON public.saas_plans
    FOR SELECT USING (is_active = true);

-- Studios policies
CREATE POLICY "Super admins can manage all studios" ON public.studios
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can view own studio" ON public.studios
    FOR SELECT USING (public.is_studio_member(id));

CREATE POLICY "Public can view active studios" ON public.studios
    FOR SELECT USING (is_active = true AND is_public = true);

-- Studio settings policies
CREATE POLICY "Super admins can manage all settings" ON public.studio_settings
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own settings" ON public.studio_settings
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Public can view studio settings" ON public.studio_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.studios 
            WHERE id = studio_id AND is_active = true AND is_public = true
        )
    );

-- Studio members policies
CREATE POLICY "Super admins can manage all members" ON public.studio_members
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio owners can manage members" ON public.studio_members
    FOR ALL USING (public.is_studio_owner(studio_id));

CREATE POLICY "Members can view own membership" ON public.studio_members
    FOR SELECT USING (user_id = auth.uid());

-- Services policies
CREATE POLICY "Super admins can manage all services" ON public.services
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own services" ON public.services
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Public can view visible services" ON public.services
    FOR SELECT USING (
        is_visible = true AND EXISTS (
            SELECT 1 FROM public.studios 
            WHERE id = studio_id AND is_active = true AND is_public = true
        )
    );

-- Portfolio albums policies
CREATE POLICY "Super admins can manage all albums" ON public.portfolio_albums
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own albums" ON public.portfolio_albums
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Public can view published albums" ON public.portfolio_albums
    FOR SELECT USING (
        is_published = true AND EXISTS (
            SELECT 1 FROM public.studios 
            WHERE id = studio_id AND is_active = true AND is_public = true
        )
    );

-- Portfolio images policies
CREATE POLICY "Super admins can manage all portfolio images" ON public.portfolio_images
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own portfolio images" ON public.portfolio_images
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Public can view images from published albums" ON public.portfolio_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.portfolio_albums pa
            JOIN public.studios s ON s.id = pa.studio_id
            WHERE pa.id = album_id 
            AND pa.is_published = true 
            AND s.is_active = true 
            AND s.is_public = true
        )
    );

-- Bookings policies
CREATE POLICY "Super admins can manage all bookings" ON public.bookings
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own bookings" ON public.bookings
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Anyone can create bookings" ON public.bookings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.studios 
            WHERE id = studio_id AND is_active = true
        )
    );

-- Program albums policies
CREATE POLICY "Super admins can manage all program albums" ON public.program_albums
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own program albums" ON public.program_albums
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Public can view published program albums" ON public.program_albums
    FOR SELECT USING (
        is_published = true AND EXISTS (
            SELECT 1 FROM public.studios 
            WHERE id = studio_id AND is_active = true AND is_public = true
        )
    );

-- Program images policies
CREATE POLICY "Super admins can manage all program images" ON public.program_images
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own program images" ON public.program_images
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Public can view images from published programs" ON public.program_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.program_albums pa
            JOIN public.studios s ON s.id = pa.studio_id
            WHERE pa.id = program_album_id 
            AND pa.is_published = true 
            AND s.is_active = true 
            AND s.is_public = true
        )
    );

-- Pages policies
CREATE POLICY "Super admins can manage all pages" ON public.pages
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own pages" ON public.pages
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Public can view published pages" ON public.pages
    FOR SELECT USING (
        is_published = true AND EXISTS (
            SELECT 1 FROM public.studios 
            WHERE id = studio_id AND is_active = true AND is_public = true
        )
    );

-- Page sections policies
CREATE POLICY "Super admins can manage all sections" ON public.page_sections
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own sections" ON public.page_sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.pages p
            WHERE p.id = page_id AND public.is_studio_member(p.studio_id)
        )
    );

CREATE POLICY "Public can view sections of published pages" ON public.page_sections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.pages p
            JOIN public.studios s ON s.id = p.studio_id
            WHERE p.id = page_id 
            AND p.is_published = true 
            AND s.is_active = true 
            AND s.is_public = true
        )
    );

-- Wedding invitations policies
CREATE POLICY "Super admins can manage all invitations" ON public.wedding_invitations
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own invitations" ON public.wedding_invitations
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Anyone can create invitation requests" ON public.wedding_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.studios 
            WHERE id = studio_id AND is_active = true
        )
    );

-- Photo search requests policies
CREATE POLICY "Super admins can manage all photo requests" ON public.photo_search_requests
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Studio members can manage own photo requests" ON public.photo_search_requests
    FOR ALL USING (public.is_studio_member(studio_id));

CREATE POLICY "Anyone can create photo search requests" ON public.photo_search_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.studios 
            WHERE id = studio_id AND is_active = true
        )
    );

-- Platform settings policies
CREATE POLICY "Super admins can manage platform settings" ON public.platform_settings
    FOR ALL USING (public.is_super_admin());

CREATE POLICY "Anyone can view platform settings" ON public.platform_settings
    FOR SELECT USING (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saas_plans_updated_at BEFORE UPDATE ON public.saas_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON public.studios
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_settings_updated_at BEFORE UPDATE ON public.studio_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_albums_updated_at BEFORE UPDATE ON public.portfolio_albums
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_program_albums_updated_at BEFORE UPDATE ON public.program_albums
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pages_updated_at BEFORE UPDATE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_page_sections_updated_at BEFORE UPDATE ON public.page_sections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wedding_invitations_updated_at BEFORE UPDATE ON public.wedding_invitations
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_platform_settings_updated_at BEFORE UPDATE ON public.platform_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INSERT DEFAULT DATA
-- ============================================

-- Insert default SaaS plans
INSERT INTO public.saas_plans (name, max_albums, max_photos, max_bookings, storage_limit_gb, price, features) VALUES
('Starter', 10, 200, 25, 5, 0, '["Basic portfolio", "Booking form", "5 pages"]'),
('Professional', 50, 1000, 100, 25, 49.99, '["Unlimited portfolio", "Booking management", "Custom pages", "Client albums"]'),
('Enterprise', 999, 9999, 999, 100, 149.99, '["Everything in Pro", "White-label", "Priority support", "API access"]');

-- Insert default platform settings
INSERT INTO public.platform_settings (platform_name, default_services) VALUES
('StudioSaaS', '[
    {"title": "Complete Indian Wedding", "description": "Full coverage of your entire wedding celebration"},
    {"title": "Wedding Video Editing", "description": "Professional editing with cinematic effects"},
    {"title": "Traditional Videography", "description": "Classic video coverage of all ceremonies"},
    {"title": "Traditional Photography", "description": "Timeless photographs of your special day"},
    {"title": "Drone Coverage", "description": "Stunning aerial shots of your venue and celebration"},
    {"title": "Cinematic Video", "description": "Movie-style wedding films"},
    {"title": "Candid Photography", "description": "Natural, unposed moments captured beautifully"},
    {"title": "3D Wedding Card Invitation", "description": "Digital animated wedding invitations"}
]');