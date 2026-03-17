import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Sparkles, Users, Image, Calendar, Search, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionContainer, SectionHeader, GlowButton } from '@/components/ui/shared';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { ROUTES } from '@/lib/routes';

const features = [
  { icon: Camera, title: 'Studio Websites', desc: 'Create a beautiful, branded website for your photography studio in minutes.' },
  { icon: Image, title: 'Portfolio & Albums', desc: 'Showcase your best work with digital albums and portfolio galleries.' },
  { icon: Search, title: 'AI Photo Finder', desc: 'Let guests find their photos using face recognition — instant results from selfies.' },
  { icon: Calendar, title: 'Booking Management', desc: 'Accept and manage event bookings, track leads, and grow your business.' },
  { icon: Users, title: 'Client Delivery', desc: 'Deliver event photos securely with QR codes and branded album pages.' },
  { icon: Sparkles, title: 'Multi-Tenant SaaS', desc: 'Each studio gets its own branded URL, settings, and complete dashboard.' },
];

const MarketingLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName="Trivora StudioOS" showAuth={true} onAuthClick={() => navigate(ROUTES.LOGIN)} />

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <SectionContainer className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles size={16} /> The all-in-one platform for photography studios
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Run Your Studio.{' '}
              <span className="text-gradient-gold">Deliver Moments.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
              Trivora StudioOS gives photography studios everything they need — websites, bookings, portfolios, event delivery, and AI-powered photo matching — all in one platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <GlowButton size="lg" onClick={() => navigate(ROUTES.LOGIN)}>
                Get Started <ArrowRight className="ml-2" size={20} />
              </GlowButton>
              <GlowButton variant="outline" size="lg" onClick={() => navigate(ROUTES.FEATURES)}>
                See Features
              </GlowButton>
            </div>
          </motion.div>
        </SectionContainer>
      </section>

      {/* Features Grid */}
      <SectionContainer>
        <SectionHeader
          title="Everything Your Studio Needs"
          subtitle="From client-facing websites to AI photo delivery — all managed from a single dashboard."
        />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 group hover:border-primary/30 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="text-primary" size={24} />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      {/* How It Works */}
      <SectionContainer className="bg-charcoal/50">
        <SectionHeader
          title="How It Works"
          subtitle="Get your studio online in three simple steps."
        />
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '1', title: 'Create Your Studio', desc: 'Sign up and we set up your branded studio page instantly.' },
            { step: '2', title: 'Customize & Upload', desc: 'Add your portfolio, services, and configure your studio settings.' },
            { step: '3', title: 'Go Live', desc: 'Share your studio URL with clients and start accepting bookings.' },
          ].map((item, index) => (
            <motion.div
              key={item.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-4">
                <span className="text-primary-foreground font-display text-2xl font-bold">{item.step}</span>
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      {/* CTA */}
      <SectionContainer>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center glass-card p-12 max-w-3xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to <span className="text-gradient-gold">Transform</span> Your Studio?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join photography studios already using Trivora StudioOS to grow their business.
          </p>
          <GlowButton size="lg" onClick={() => navigate(ROUTES.LOGIN)}>
            Get Started Free <ArrowRight className="ml-2" size={20} />
          </GlowButton>
        </motion.div>
      </SectionContainer>

      <Footer studioName="Trivora StudioOS" />
    </div>
  );
};

export default MarketingLanding;
