// Multi-tenant Photography Studio SaaS Types

export type AppRole = 'super_admin' | 'studio_admin';

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface SaasPlan {
  id: string;
  name: string;
  max_albums: number;
  max_photos: number;
  max_bookings: number;
  storage_limit_gb: number;
  price: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  saas_plan_id: string | null;
  is_active: boolean;
  is_public: boolean;
  subdomain: string | null;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
  // Relations
  saas_plan?: SaasPlan | null;
  settings?: StudioSettings | null;
}

export interface StudioSettings {
  id: string;
  studio_id: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  social_facebook: string | null;
  social_instagram: string | null;
  social_youtube: string | null;
  google_drive_folder: string | null;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioMember {
  id: string;
  studio_id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export interface Service {
  id: string;
  studio_id: string;
  title: string;
  description: string | null;
  price: number | null;
  images: string[];
  is_visible: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PortfolioAlbum {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  category: string | null;
  cover_image_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Relations
  images?: PortfolioImage[];
}

export interface PortfolioImage {
  id: string;
  studio_id: string;
  album_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Booking {
  id: string;
  studio_id: string;
  name: string;
  phone: string;
  email: string | null;
  event_type: string | null;
  event_dates: string[];
  location: string | null;
  services_required: string[];
  notes: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ProgramAlbum {
  id: string;
  studio_id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  qr_code_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  images?: ProgramImage[];
}

export interface ProgramImage {
  id: string;
  studio_id: string;
  program_album_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

export interface Page {
  id: string;
  studio_id: string;
  title: string;
  slug: string;
  is_published: boolean;
  show_in_nav: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Relations
  sections?: PageSection[];
}

export interface PageSection {
  id: string;
  page_id: string;
  section_type: 'hero' | 'text' | 'gallery' | 'cta' | 'testimonial' | 'custom';
  content: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WeddingInvitation {
  id: string;
  studio_id: string;
  bride_name: string;
  groom_name: string;
  event_date: string | null;
  venue: string | null;
  message: string | null;
  template_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhotoSearchRequest {
  id: string;
  studio_id: string;
  name: string;
  phone: string;
  selfie_url: string | null;
  status: 'pending' | 'processing' | 'completed';
  created_at: string;
}

export interface PlatformSettings {
  id: string;
  platform_name: string;
  default_theme: {
    primaryColor: string;
    secondaryColor: string;
  };
  default_services: Array<{
    title: string;
    description: string;
  }>;
  default_pages: Array<{
    title: string;
    slug: string;
  }>;
  created_at: string;
  updated_at: string;
}
