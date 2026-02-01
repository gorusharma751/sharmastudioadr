import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

interface GlassNavbarProps {
  studioName?: string;
  logoUrl?: string;
  navItems?: NavItem[];
  showAuth?: boolean;
  isAuthenticated?: boolean;
  onAuthClick?: () => void;
}

const GlassNavbar: React.FC<GlassNavbarProps> = ({
  studioName = 'Studio',
  logoUrl,
  navItems = [],
  showAuth = true,
  isAuthenticated = false,
  onAuthClick,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on route change
  React.useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const defaultNavItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'About', href: '/about' },
    { label: 'Booking', href: '/booking' },
    { label: 'Contact', href: '/contact' },
  ];

  const items = navItems.length > 0 ? navItems : defaultNavItems;

  const handleBookNow = () => {
    navigate('/booking');
    setIsOpen(false);
  };

  const handleAuthClick = () => {
    setIsOpen(false);
    if (onAuthClick) {
      onAuthClick();
    } else {
      navigate('/auth');
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
            <Link to="/" className="flex items-center gap-3 group z-10">
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
                <NavLink key={item.href} item={item} currentPath={location.pathname} />
              ))}
            </div>

            {/* Auth Button / CTA */}
            <div className="hidden lg:flex items-center gap-4">
              {showAuth && (
                <Button
                  variant="ghost"
                  className="text-foreground hover:text-primary"
                  onClick={handleAuthClick}
                >
                  {isAuthenticated ? 'Dashboard' : 'Login'}
                </Button>
              )}
              <Button className="btn-premium px-6" onClick={handleBookNow}>
                Book Now
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

      {/* Mobile Menu - Full Screen Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-background/95 backdrop-blur-xl z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu Content */}
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
                    <Button
                      variant="outline"
                      className="w-full btn-outline-gold h-14 text-lg"
                      onClick={handleAuthClick}
                    >
                      {isAuthenticated ? 'Dashboard' : 'Login'}
                    </Button>
                  )}
                  <Button 
                    className="w-full btn-premium h-14 text-lg"
                    onClick={handleBookNow}
                  >
                    Book Now
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

const NavLink: React.FC<{ item: NavItem; currentPath: string }> = ({ item, currentPath }) => {
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
