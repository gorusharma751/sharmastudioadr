import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  Camera,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/routes';

const SuperAdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { signOut, user, loading, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // ── Route guard ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate(ROUTES.LOGIN_ADMIN, { replace: true });
      return;
    }
    if (!isSuperAdmin) {
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [user, loading, isSuperAdmin, navigate]);

  // ── noindex meta ────────────────────────────────────────────────────────
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { if (meta.parentNode) meta.parentNode.removeChild(meta); };
  }, []);

  // ── Close mobile menu on route change ──────────────────────────────────
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard',  href: '/admin',           icon: LayoutDashboard },
    { label: 'Studios',    href: '/admin/studios',    icon: Building2 },
    { label: 'SaaS Plans', href: '/admin/plans',      icon: CreditCard },
    { label: 'Users',      href: '/admin/users',      icon: Users },
    { label: 'Analytics',  href: '/admin/analytics',  icon: BarChart3 },
    { label: 'Settings',   href: '/admin/settings',   icon: Settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate(ROUTES.LOGIN_ADMIN, { replace: true });
  };

  // ── Show spinner while auth resolves ────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Guard: don't render layout if not super admin (redirect is in flight)
  if (!user || !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Sidebar (desktop) ────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-sidebar border-r border-sidebar-border fixed left-0 top-0 bottom-0 z-40">
        <div className="p-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-gold flex items-center justify-center flex-shrink-0">
            <Camera className="text-primary-foreground" size={20} />
          </div>
          <span className="font-display text-xl font-bold text-sidebar-foreground">
            Trivora StudioOS
          </span>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link key={href} to={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                )}>
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-foreground">
                {user.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground">Super Admin</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={handleSignOut}
          >
            <LogOut size={18} />
            <span className="ml-2">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* ── Mobile header ────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Camera className="text-primary-foreground" size={16} />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground">Trivora StudioOS</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-sidebar-foreground"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <motion.div
        initial={{ x: '-100%' }} animate={{ x: mobileMenuOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="lg:hidden fixed left-0 top-16 bottom-0 w-72 bg-sidebar border-r border-sidebar-border z-40"
      >
        <nav className="p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = location.pathname === href;
            return (
              <Link key={href} to={href} onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                )}>
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground"
            onClick={handleSignOut}
          >
            <LogOut size={18} className="mr-2" /> Sign Out
          </Button>
        </div>
      </motion.div>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <main className="flex-1 min-h-screen lg:ml-[280px] pt-16 lg:pt-0 transition-all duration-300">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
