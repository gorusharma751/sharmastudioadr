import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Video, Plane, Heart, Film, ImageIcon, FileImage, Sparkles } from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer, SectionHeader, AnimatedCard } from '@/components/ui/shared';
import { useStudio } from '@/contexts/StudioContext';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, typeof Camera> = {
  'Complete Indian Wedding': Heart,
  'Wedding Video Editing': Film,
  'Traditional Videography': Video,
  'Traditional Photography': Camera,
  'Drone Coverage': Plane,
  'Cinematic Video': Film,
  'Candid Photography': ImageIcon,
  '3D Wedding Invitation': FileImage,
};

const defaultImages = [
  'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&q=80',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
  'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80',
  'https://images.unsplash.com/photo-1518173946687-a4c036bc9020?w=800&q=80',
  'https://images.unsplash.com/photo-1605117882932-f9e32b03fea9?w=800&q=80',
  'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80',
];

const ServicesPage: React.FC = () => {
  const { studio, settings, services, loading } = useStudio();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName="Loading..." />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-96 rounded-xl" />
              ))}
            </div>
          </SectionContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-32 pb-20"
      >
        <SectionContainer>
          <SectionHeader
            title="Our Services"
            subtitle="We offer a comprehensive range of photography and videography services to capture your most cherished moments with artistic excellence."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => {
              const IconComponent = iconMap[service.title] || Camera;
              const imageUrl = (service.images as string[])?.[0] || defaultImages[index % defaultImages.length];

              return (
                <AnimatedCard key={service.id} delay={index * 0.1} className="group overflow-hidden">
                  <div className="relative h-64 overflow-hidden">
                    <motion.img
                      src={imageUrl}
                      alt={service.title}
                      className="w-full h-full object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                    <motion.div 
                      className="absolute bottom-4 left-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm border border-primary/30">
                        <IconComponent className="text-primary" size={28} />
                      </div>
                    </motion.div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {service.description || 'Professional service tailored to capture your special moments.'}
                    </p>
                    {service.price && (
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-bold text-lg">
                          ₹{service.price.toLocaleString()}
                        </span>
                        <motion.span 
                          className="text-xs text-muted-foreground"
                          whileHover={{ x: 5 }}
                        >
                          Starting price →
                        </motion.span>
                      </div>
                    )}
                  </div>
                </AnimatedCard>
              );
            })}
          </div>

          {services.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Sparkles className="mx-auto text-primary mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Services Coming Soon</h3>
              <p className="text-muted-foreground">Check back later for our amazing services.</p>
            </motion.div>
          )}
        </SectionContainer>
      </motion.div>
      
      <Footer studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} settings={settings} />
    </div>
  );
};

export default ServicesPage;
