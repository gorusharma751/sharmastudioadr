import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Settings,
  FileText,
  Camera,
  Briefcase,
  Calendar,
  Image,
  QrCode,
  Heart,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Users,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const StudioAdminLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { signOut, user, loading, currentStudio, isStudioAdmin, isSuperAdmin, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!loading && !user) {
      navigate('/studio/login', { replace: true });
    }
    if (!loading && user && role !== null && !isStudioAdmin && !isSuperAdmin) {
      navigate('/studio/login', { replace: true });
    }
  }, [user, loading, role, isStudioAdmin, isSuperAdmin, navigate]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = [
    { label: 'Dashboard', href: '/studio', icon: LayoutDashboard },
    { label: 'Studio Settings', href: '/studio/settings', icon: Settings },
    { label: 'Pages', href: '/studio/pages', icon: FileText },
    { label: 'Services', href: '/studio/services', icon: Briefcase },
    { label: 'Portfolio', href: '/studio/portfolio', icon: Camera },
    { label: 'Bookings', href: '/studio/bookings', icon: Calendar },
    { label: 'Event Albums', href: '/studio/albums', icon: Image },
    { label: 'Album Settings', href: '/studio/album-settings', icon: Sliders },
    { label: 'Leads', href: '/studio/leads', icon: Users },
    { label: 'Find Your Photos', href: '/studio/find-photos', icon: QrCode },
    { label: 'Invitations', href: '/studio/invitations', icon: Heart },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/studio/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop (fixed width, no collapse) */}
      <aside className="hidden lg:flex flex-col w-[280px] bg-sidebar border-r border-sidebar-border fixed left-0 top-0 bottom-0 z-40">
        {/* Studio Branding - No Dropdown */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50">
            <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
              <Camera className="text-primary-foreground" size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sidebar-foreground truncate">
                {currentStudio?.name || 'My Studio'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                /{currentStudio?.slug || 'studio'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} />
                </div>
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* View Website */}
        <div className="px-3 pb-3">
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <div className="w-9 h-9 flex items-center justify-center">
              <ExternalLink size={20} />
            </div>
            <span className="text-sm font-medium">View Website</span>
          </Link>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-sm font-medium text-sidebar-foreground">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">Studio Admin</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
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

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Camera className="text-primary-foreground" size={16} />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground truncate max-w-[180px]">
            {currentStudio?.name || 'Studio'}
          </span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-sidebar-foreground">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-background/95 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: mobileMenuOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="lg:hidden fixed left-0 top-16 bottom-0 w-72 bg-sidebar border-r border-sidebar-border z-50 overflow-y-auto"
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link key={item.href} to={item.href} onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive ? 'bg-sidebar-accent text-sidebar-primary' : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}>
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={handleSignOut}>
            <LogOut size={18} className="mr-2" /> Sign Out
          </Button>
        </div>
      </motion.div>

      {/* Main Content */}
      <main className="flex-1 min-h-screen lg:ml-[280px] pt-16 lg:pt-0 transition-all duration-300">
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudioAdminLayout;
