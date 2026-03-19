import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Star, Camera, Video, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionContainer } from '@/components/ui/shared';
import { Link, useNavigate } from 'react-router-dom';
import { useStudio } from '@/contexts/StudioContext';

// Premium placeholder images for hero
const heroImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
  'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
];

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const { settings } = useStudio();

  const themeType = (settings as any)?.theme_type || 'gradient';
  const primaryColor = settings?.primary_color || '#D4AF37';
  const secondaryColor = settings?.secondary_color || '#1a1a2e';
  const gradientAngle = (settings as any)?.gradient_angle || 45;

  const backgroundStyle = themeType === 'gradient'
    ? { background: `linear-gradient(${gradientAngle}deg, ${primaryColor}, ${secondaryColor})` }
    : { background: primaryColor };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden" style={backgroundStyle}>
      {/* Background Pattern */}
      <div className="absolute inset-0 pattern-dots opacity-30" />
      
      {/* Floating Elements */}
      <motion.div 
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 left-10 w-20 h-20 rounded-full bg-primary/10 blur-xl" 
      />
      <motion.div 
        animate={{ y: [0, 20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-40 right-20 w-32 h-32 rounded-full bg-primary/5 blur-2xl" 
      />
      
      <SectionContainer className="relative z-10 pt-32 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
            >
              <Sparkles size={16} className="text-primary" />
              <span className="text-sm text-primary font-medium">Premium Photography Studio</span>
            </motion.div>
            
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6">
              Capturing Your{' '}
              <span className="text-gradient-gold">Precious</span>{' '}
              Moments Forever
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              We specialize in creating timeless memories through our lens. 
              From weddings to portraits, we transform moments into masterpieces.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="btn-premium group"
                onClick={() => navigate('/booking')}
              >
                Book a Session
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="btn-outline-gold group"
                onClick={() => navigate('/portfolio')}
              >
                <Play className="mr-2" size={18} />
                View Portfolio
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex items-center gap-6 mt-12">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium"
                  >
                    {i}K
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1 text-primary">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={16} fill="currentColor" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">500+ Happy Clients</p>
              </div>
            </div>
          </motion.div>
          
          {/* Image Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            <div className="grid grid-cols-2 gap-4">
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="space-y-4"
              >
                <div className="rounded-2xl overflow-hidden glow-gold">
                  <img
                    src={heroImages[0]}
                    alt="Wedding Photography"
                    className="w-full h-64 object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src={heroImages[1]}
                    alt="Couple Portrait"
                    className="w-full h-48 object-cover"
                  />
                </div>
              </motion.div>
              <motion.div
                initial={{ y: -20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="space-y-4 pt-8"
              >
                <div className="rounded-2xl overflow-hidden">
                  <img
                    src={heroImages[2]}
                    alt="Event Photography"
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="rounded-2xl overflow-hidden bg-gradient-gold p-6 flex flex-col justify-center">
                  <Camera className="text-primary-foreground mb-3" size={32} />
                  <p className="text-primary-foreground font-display text-2xl font-bold">10+</p>
                  <p className="text-primary-foreground/80 text-sm">Years Experience</p>
                </div>
              </motion.div>
            </div>
            
            {/* Decorative Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-6 -left-6 p-4 rounded-xl glass glow-gold"
            >
              <div className="flex items-center gap-3">
                <Video className="text-primary" size={24} />
                <div>
                  <p className="font-semibold text-foreground">4K Video</p>
                  <p className="text-xs text-muted-foreground">Cinematic Quality</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </SectionContainer>
      
      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-6 h-10 rounded-full border-2 border-primary/50 flex justify-center pt-2"
        >
          <div className="w-1.5 h-3 bg-primary rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
