import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/lib/routes';
import { StudioSettings } from '@/types/database';

interface NavItem {
  label: string;
  href: string;
}

interface GlassNavbarProps {
  studioName?: string;
  logoUrl?: string;
  studioSlug?: string;
  studioId?: string;
  navItems?: NavItem[];
  showAuth?: boolean;
  isAuthenticated?: boolean;
  onAuthClick?: () => void;
  settings?: Partial<StudioSettings>;
}

const GlassNavbar: React.FC<GlassNavbarProps> = ({
  studioName = 'Studio',
  logoUrl,
  studioSlug,
  studioId,
  navItems = [],
  showAuth = true,
  isAuthenticated = false,
  onAuthClick,
  settings,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [dynamicPages, setDynamicPages] = React.useState<NavItem[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const primaryColor = settings?.primary_color || '#D4AF37';
  const buttonStyle = {
    backgroundColor: primaryColor,
    color: '#fff'
  };

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  React.useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Fetch dynamic pages for navbar (studio-scoped)
  React.useEffect(() => {
    if (!studioId) return;

    const fetchNavPages = async () => {
      try {
        const { data } = await supabase
          .from('pages')
          .select('title, slug, sort_order')
          .eq('studio_id', studioId)
          .eq('is_published', true)
          .eq('show_in_nav', true)
          .order('sort_order');

        if (data) {
          const basePath = studioSlug ? `/@${studioSlug}` : '';
          setDynamicPages(data.map(p => ({ label: p.title, href: `${basePath}/page/${p.slug}` })));
        }
      } catch (e) {
        console.error('Error fetching nav pages:', e);
      }
    };
    fetchNavPages();
  }, [studioId, studioSlug]);

  const basePath = studioSlug ? `/@${studioSlug}` : '';

  const defaultNavItems: NavItem[] = studioSlug
    ? [
        { label: 'Home', href: basePath || '/' },
        { label: 'Services', href: `${basePath}/services` },
        { label: 'Portfolio', href: `${basePath}/portfolio` },
        { label: 'About', href: `${basePath}/about` },
        { label: 'Booking', href: `${basePath}/booking` },
        { label: 'Contact', href: `${basePath}/contact` },
      ]
    : [
        { label: 'Home', href: ROUTES.HOME },
        { label: 'Features', href: ROUTES.FEATURES },
        { label: 'Pricing', href: ROUTES.PRICING },
      ];

  const staticItems = navItems.length > 0 ? navItems : defaultNavItems;
  const items = [...staticItems, ...dynamicPages];

  const handleBookNow = () => {
    navigate(studioSlug ? `${basePath}/booking` : ROUTES.PRICING);
    setIsOpen(false);
  };

  const handleAuthClick = () => {
    setIsOpen(false);
    if (onAuthClick) {
      onAuthClick();
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
          scrolled ? 'glass-strong py-3' : 'bg-background/80 backdrop-blur-md py-5'
        )}
      >
        <div className="section-container">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={studioSlug ? basePath : '/'} className="flex items-center gap-3 group z-10">
              {logoUrl ? (
                <img src={logoUrl} alt={studioName} className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-lg">
                    {studioName.charAt(0)}
                  </span>
                </div>
              )}
              <span className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                {studioName}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {items.map((item) => (
                <NavLinkItem key={item.href} item={item} currentPath={location.pathname} />
              ))}
            </div>

            {/* Auth Button / CTA */}
            <div className="hidden lg:flex items-center gap-4">
              {showAuth && (
                <Button variant="ghost" className="text-foreground hover:text-primary" onClick={handleAuthClick}>
                  {isAuthenticated ? 'Dashboard' : 'Login'}
                </Button>
              )}
              <Button className="btn-premium px-6" style={buttonStyle} onClick={handleBookNow}>
                {studioSlug ? 'Book Now' : 'Get Started'}
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="lg:hidden p-2 text-foreground hover:text-primary transition-colors z-10"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-background/95 backdrop-blur-xl z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden fixed inset-x-0 top-[72px] bottom-0 z-40 overflow-y-auto"
            >
              <div className="section-container py-8">
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Link
                        to={item.href}
                        className={cn(
                          'block py-4 text-2xl font-display font-medium transition-colors border-b border-border',
                          location.pathname === item.href
                            ? 'text-primary'
                            : 'text-foreground hover:text-primary'
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <motion.div
                  className="pt-8 space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {showAuth && (
                    <Button variant="outline" className="w-full btn-outline-gold h-14 text-lg" onClick={handleAuthClick}>
                      {isAuthenticated ? 'Dashboard' : 'Login'}
                    </Button>
                  )}
                  <Button className="w-full btn-premium h-14 text-lg" style={buttonStyle} onClick={handleBookNow}>
                    {studioSlug ? 'Book Now' : 'Get Started'}
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const NavLinkItem: React.FC<{ item: NavItem; currentPath: string }> = ({ item, currentPath }) => {
  const isActive = currentPath === item.href;
  return (
    <Link
      to={item.href}
      className={cn(
        'relative py-2 text-sm font-medium transition-colors',
        isActive ? 'text-primary' : 'text-foreground/80 hover:text-foreground'
      )}
    >
      {item.label}
      {isActive && (
        <motion.div
          layoutId="navbar-indicator"
          className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
        />
      )}
    </Link>
  );
};

export default GlassNavbar;
