import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Globe, Search, Calendar, Image, Users, Palette, QrCode,
  Shield, Zap, BarChart3, Smartphone, ArrowRight,
} from 'lucide-react';
import { SectionContainer, SectionHeader, GlowButton } from '@/components/ui/shared';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { ROUTES } from '@/lib/routes';

const featureGroups = [
  {
    category: 'Studio Website',
    features: [
      { icon: Globe, title: 'Custom Studio Pages', desc: 'Each studio gets a unique branded URL with customizable pages, hero sections, and content.' },
      { icon: Palette, title: 'Theme & Branding', desc: 'Upload your logo, choose colors, and create a gradient theme that matches your brand identity.' },
      { icon: Smartphone, title: 'Mobile Responsive', desc: 'Every studio website is fully responsive and optimized for mobile devices.' },
    ],
  },
  {
    category: 'Event & Photo Delivery',
    features: [
      { icon: Search, title: 'AI Photo Finder', desc: 'Guests upload a selfie and AI face recognition instantly finds their photos from the event.' },
      { icon: QrCode, title: 'QR Code Access', desc: 'Generate QR codes for events — guests scan and access their photos directly on their phones.' },
      { icon: Image, title: 'Digital Albums', desc: 'Create beautiful digital albums with music, watermarks, and lead capture forms.' },
    ],
  },
  {
    category: 'Business Management',
    features: [
      { icon: Calendar, title: 'Booking System', desc: 'Accept booking requests with event types, dates, and service requirements.' },
      { icon: Users, title: 'Lead Capture', desc: 'Collect leads from album views and convert them into paying clients.' },
      { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track bookings, website visitors, and portfolio engagement in one dashboard.' },
    ],
  },
  {
    category: 'Platform & Security',
    features: [
      { icon: Shield, title: 'Role-Based Access', desc: 'Strict separation between super admin, studio owner, and event guest roles.' },
      { icon: Camera, title: 'Multi-Tenant Architecture', desc: 'Each studio operates independently with its own data, settings, and public website.' },
      { icon: Zap, title: 'Fast & Reliable', desc: 'Built on modern cloud infrastructure with Supabase, ensuring speed and reliability.' },
    ],
  },
];

const FeaturesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName="Trivora StudioOS" showAuth={true} onAuthClick={() => navigate(ROUTES.LOGIN)} />

      <section className="pt-32 pb-12">
        <SectionContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Platform <span className="text-gradient-gold">Features</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Everything photography studios need to build their online presence, manage events, and deliver photos to clients.
            </p>
          </motion.div>
        </SectionContainer>
      </section>

      {featureGroups.map((group, groupIdx) => (
        <SectionContainer key={group.category} className={groupIdx % 2 === 1 ? 'bg-charcoal/50' : ''}>
          <SectionHeader title={group.category} />
          <div className="grid md:grid-cols-3 gap-6">
            {group.features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="text-primary" size={24} />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </SectionContainer>
      ))}

      <SectionContainer>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center glass-card p-12 max-w-3xl mx-auto"
        >
          <h2 className="font-display text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Set up your studio in minutes and start growing your business.
          </p>
          <GlowButton size="lg" onClick={() => navigate(ROUTES.LOGIN)}>
            Get Started <ArrowRight className="ml-2" size={20} />
          </GlowButton>
        </motion.div>
      </SectionContainer>

      <Footer studioName="Trivora StudioOS" />
    </div>
  );
};

export default FeaturesPage;
