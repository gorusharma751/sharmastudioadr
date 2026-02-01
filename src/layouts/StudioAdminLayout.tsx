import React from 'react';
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
  Users,
  Heart,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const StudioAdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { signOut, user, currentStudio, studios, setCurrentStudio } = useAuth();
  const [studioDropdownOpen, setStudioDropdownOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Studio Settings', href: '/admin/settings', icon: Settings },
    { label: 'Pages', href: '/admin/pages', icon: FileText },
    { label: 'Services', href: '/admin/services', icon: Briefcase },
    { label: 'Portfolio', href: '/admin/portfolio', icon: Camera },
    { label: 'Bookings', href: '/admin/bookings', icon: Calendar },
    { label: 'Event Albums', href: '/admin/albums', icon: Image },
    { label: 'Find Your Photos', href: '/admin/find-photos', icon: QrCode },
    { label: 'Invitations', href: '/admin/invitations', icon: Heart },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 280 : 80 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border',
          'fixed left-0 top-0 bottom-0 z-40'
        )}
      >
        {/* Studio Selector */}
        <div className="p-4 border-b border-sidebar-border">
          {sidebarOpen ? (
            <div className="relative">
              <button
                onClick={() => setStudioDropdownOpen(!studioDropdownOpen)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors"
              >
                <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
                  <Camera className="text-primary-foreground" size={18} />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="font-medium text-sidebar-foreground truncate">
                    {currentStudio?.name || 'Select Studio'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    /{currentStudio?.slug || 'no-studio'}
                  </p>
                </div>
                <ChevronDown
                  size={16}
                  className={cn(
                    'text-muted-foreground transition-transform',
                    studioDropdownOpen && 'rotate-180'
                  )}
                />
              </button>

              {studioDropdownOpen && studios.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  {studios.map((studio) => (
                    <button
                      key={studio.id}
                      onClick={() => {
                        setCurrentStudio(studio);
                        setStudioDropdownOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 hover:bg-sidebar-accent/50 transition-colors',
                        currentStudio?.id === studio.id && 'bg-sidebar-accent'
                      )}
                    >
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {studio.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">
                          {studio.name}
                        </p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                <Camera className="text-primary-foreground" size={18} />
              </div>
            </div>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/80 transition-colors"
        >
          {sidebarOpen ? '←' : '→'}
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon size={20} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* View Website Link */}
        {currentStudio && (
          <div className="px-4 pb-4">
            <Link
              to={`/studio/${currentStudio.slug}`}
              target="_blank"
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-lg',
                'bg-primary/10 text-primary hover:bg-primary/20 transition-colors',
                !sidebarOpen && 'justify-center'
              )}
            >
              <ExternalLink size={18} />
              {sidebarOpen && <span>View Website</span>}
            </Link>
          </div>
        )}

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent flex items-center justify-center">
                <span className="text-sm font-medium text-sidebar-foreground">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  Studio Admin
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          ) : null}
          <Button
            variant="ghost"
            className={cn(
              'text-sidebar-foreground hover:bg-sidebar-accent',
              sidebarOpen ? 'w-full justify-start' : 'w-full justify-center'
            )}
            onClick={handleSignOut}
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-sidebar-border z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-gold flex items-center justify-center">
            <Camera className="text-primary-foreground" size={16} />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground truncate max-w-[150px]">
            {currentStudio?.name || 'Studio'}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-sidebar-foreground"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <motion.div
        initial={{ x: '-100%' }}
        animate={{ x: mobileMenuOpen ? 0 : '-100%' }}
        transition={{ type: 'tween', duration: 0.3 }}
        className="lg:hidden fixed left-0 top-16 bottom-0 w-72 bg-sidebar border-r border-sidebar-border z-40 overflow-y-auto"
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                )}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </motion.div>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 min-h-screen',
          sidebarOpen ? 'lg:ml-[280px]' : 'lg:ml-20',
          'pt-16 lg:pt-0',
          'transition-all duration-300'
        )}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default StudioAdminLayout;
