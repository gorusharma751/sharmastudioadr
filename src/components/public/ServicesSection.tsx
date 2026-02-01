import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Video, Plane, Heart, Film, ImageIcon, FileImage, ArrowRight } from 'lucide-react';
import { SectionContainer, SectionHeader, AnimatedCard } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Service } from '@/types/database';
import { useNavigate } from 'react-router-dom';

// Default services with premium images and prices
const defaultServices = [
  {
    id: '1',
    title: 'Complete Indian Wedding',
    description: 'Full coverage of your entire wedding celebration including all ceremonies, functions, and rituals.',
    icon: Heart,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
    price: 150000,
  },
  {
    id: '2',
    title: 'Wedding Video Editing',
    description: 'Professional editing with cinematic effects, color grading, and storytelling that captures your love story.',
    icon: Film,
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80',
    price: 35000,
  },
  {
    id: '3',
    title: 'Traditional Videography',
    description: 'Classic video coverage of all ceremonies preserving every precious moment in high definition.',
    icon: Video,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
    price: 45000,
  },
  {
    id: '4',
    title: 'Traditional Photography',
    description: 'Timeless photographs capturing the essence of your special day with artistic composition.',
    icon: Camera,
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&q=80',
    price: 40000,
  },
  {
    id: '5',
    title: 'Drone Coverage',
    description: 'Stunning aerial shots of your venue and celebration, adding a cinematic perspective.',
    icon: Plane,
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80',
    price: 25000,
  },
  {
    id: '6',
    title: 'Cinematic Video',
    description: 'Movie-style wedding films with professional cinematography and emotional storytelling.',
    icon: Film,
    image: 'https://images.unsplash.com/photo-1518173946687-a4c036bc9020?w=600&q=80',
    price: 75000,
  },
  {
    id: '7',
    title: 'Candid Photography',
    description: 'Natural, unposed moments captured beautifully, revealing genuine emotions and connections.',
    icon: ImageIcon,
    image: 'https://images.unsplash.com/photo-1605117882932-f9e32b03fea9?w=600&q=80',
    price: 30000,
  },
  {
    id: '8',
    title: '3D Wedding Invitation',
    description: 'Digital animated wedding invitations with stunning 3D effects and personalized designs.',
    icon: FileImage,
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80',
    price: 15000,
  },
];

interface ServicesSectionProps {
  services?: Service[];
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ services }) => {
  const navigate = useNavigate();
  
  // Merge DB services with defaults, ensuring price is always shown
  const displayServices = services?.length 
    ? services.map((service, index) => {
        const defaultService = defaultServices.find(d => d.title === service.title) || defaultServices[index % defaultServices.length];
        return {
          ...service,
          icon: defaultService.icon,
          image: (service.images as string[])?.[0] || defaultService.image,
          price: service.price || defaultService.price,
        };
      })
    : defaultServices;

  return (
    <section className="bg-charcoal py-24">
      <SectionContainer>
        <SectionHeader
          title="Our Services"
          subtitle="We offer a comprehensive range of photography and videography services to capture your most cherished moments"
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayServices.slice(0, 8).map((service, index) => {
            const IconComponent = 'icon' in service ? service.icon : Camera;

            return (
              <AnimatedCard
                key={service.id}
                delay={index * 0.1}
                className="group flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <motion.img
                    src={'image' in service ? service.image : ''}
                    alt={service.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm inline-block">
                      <IconComponent className="text-primary" size={24} />
                    </div>
                  </div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 flex-1">
                    {service.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Starting from</p>
                      <p className="text-lg font-bold text-primary">
                        ₹{(service.price || 0).toLocaleString()}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-primary hover:text-primary"
                      onClick={() => navigate('/booking')}
                    >
                      Book
                      <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </div>

        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <Button 
            size="lg" 
            className="btn-premium"
            onClick={() => navigate('/services')}
          >
            View All Services
            <ArrowRight size={18} className="ml-2" />
          </Button>
        </motion.div>
      </SectionContainer>
    </section>
  );
};

export default ServicesSection;
