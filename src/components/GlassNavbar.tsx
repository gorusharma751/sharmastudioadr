import React from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';
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

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const defaultNavItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'About', href: '/about' },
    { label: 'Booking', href: '/booking' },
    { label: 'Contact', href: '/contact' },
  ];

  const items = navItems.length > 0 ? navItems : defaultNavItems;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass-strong py-3' : 'bg-transparent py-5'
      )}
    >
      <div className="section-container">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
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
                onClick={onAuthClick}
              >
                {isAuthenticated ? 'Dashboard' : 'Login'}
              </Button>
            )}
            <Button className="btn-premium px-6">
              Book Now
            </Button>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-foreground hover:text-primary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{ 
            height: isOpen ? 'auto' : 0,
            opacity: isOpen ? 1 : 0 
          }}
          transition={{ duration: 0.3 }}
          className="lg:hidden overflow-hidden"
        >
          <div className="py-6 space-y-4">
            {items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'block py-2 text-lg font-medium transition-colors',
                  location.pathname === item.href
                    ? 'text-primary'
                    : 'text-foreground hover:text-primary'
                )}
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 space-y-3">
              {showAuth && (
                <Button
                  variant="outline"
                  className="w-full btn-outline-gold"
                  onClick={() => {
                    setIsOpen(false);
                    onAuthClick?.();
                  }}
                >
                  {isAuthenticated ? 'Dashboard' : 'Login'}
                </Button>
              )}
              <Button className="w-full btn-premium">
                Book Now
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.nav>
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
