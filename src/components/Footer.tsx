import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Youtube, Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FooterProps {
  studioName?: string;
  logoUrl?: string;
  settings?: {
    contact_email?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    social_facebook?: string | null;
    social_instagram?: string | null;
    social_youtube?: string | null;
  } | null;
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  studioName = 'Studio',
  logoUrl,
  settings,
  className,
}) => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: 'Portfolio', href: '/portfolio' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  const services = [
    'Wedding Photography',
    'Event Coverage',
    'Portrait Sessions',
    'Commercial Shoots',
    'Video Production',
  ];

  return (
    <footer className={cn('bg-charcoal border-t border-border', className)}>
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              {logoUrl ? (
                <img src={logoUrl} alt={studioName} className="h-10 w-auto" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-gradient-gold flex items-center justify-center">
                  <span className="text-primary-foreground font-display font-bold text-lg">
                    {studioName.charAt(0)}
                  </span>
                </div>
              )}
              <span className="font-display text-xl font-semibold text-foreground">
                {studioName}
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-6">
              Capturing your precious moments with artistry and passion. 
              Let us tell your story through our lens.
            </p>
            
            {/* Social Links */}
            <div className="flex gap-4">
              {settings?.social_instagram && (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Instagram size={20} />
                </a>
              )}
              {settings?.social_facebook && (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Facebook size={20} />
                </a>
              )}
              {settings?.social_youtube && (
                <a
                  href={settings.social_youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-secondary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <Youtube size={20} />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">
              Our Services
            </h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service}>
                  <span className="text-muted-foreground">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-lg font-semibold text-foreground mb-4">
              Contact Us
            </h4>
            <ul className="space-y-4">
              {settings?.contact_email && (
                <li className="flex items-start gap-3">
                  <Mail size={18} className="text-primary mt-0.5" />
                  <a
                    href={`mailto:${settings.contact_email}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {settings.contact_email}
                  </a>
                </li>
              )}
              {settings?.contact_phone && (
                <li className="flex items-start gap-3">
                  <Phone size={18} className="text-primary mt-0.5" />
                  <a
                    href={`tel:${settings.contact_phone}`}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    {settings.contact_phone}
                  </a>
                </li>
              )}
              {settings?.address && (
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary mt-0.5" />
                  <span className="text-muted-foreground">{settings.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {currentYear} {studioName}. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
