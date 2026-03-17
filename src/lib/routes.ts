// Trivora StudioOS — Centralized Route Constants

export const ROUTES = {
  // Marketing
  HOME: '/',
  FEATURES: '/features',
  PRICING: '/pricing',

  // Auth
  LOGIN: '/login',
  LOGIN_STUDIO: '/login/studio',
  LOGIN_ADMIN: '/login/admin',

  // Super Admin
  ADMIN: '/admin',
  ADMIN_STUDIOS: '/admin/studios',

  // Studio Dashboard
  DASHBOARD: '/dashboard',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  DASHBOARD_EVENTS: '/dashboard/events',
  DASHBOARD_BOOKINGS: '/dashboard/bookings',
  DASHBOARD_PORTFOLIO: '/dashboard/portfolio',
  DASHBOARD_PAGES: '/dashboard/pages',
  DASHBOARD_SERVICES: '/dashboard/services',
  DASHBOARD_ALBUMS: '/dashboard/albums',
  DASHBOARD_ALBUM_SETTINGS: '/dashboard/album-settings',
  DASHBOARD_LEADS: '/dashboard/leads',
  DASHBOARD_FIND_PHOTOS: '/dashboard/find-photos',
  DASHBOARD_INVITATIONS: '/dashboard/invitations',

  // Guest
  FIND_PHOTOS: '/find-photos',
} as const;

/** Build a public studio URL: `/@slug` or `/@slug/path` */
export const studioUrl = (slug: string, path: string = '') =>
  `/@${slug}${path}`;
