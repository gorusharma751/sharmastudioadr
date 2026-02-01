import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Video, Plane, Sparkles, Heart, Film, ImageIcon, FileImage } from 'lucide-react';
import { SectionContainer, SectionHeader, AnimatedCard } from '@/components/ui/shared';
import { Service } from '@/types/database';

// Default services with premium images
const defaultServices = [
  {
    id: '1',
    title: 'Complete Indian Wedding',
    description: 'Full coverage of your entire wedding celebration including all ceremonies, functions, and rituals.',
    icon: Heart,
    image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80',
  },
  {
    id: '2',
    title: 'Wedding Video Editing',
    description: 'Professional editing with cinematic effects, color grading, and storytelling that captures your love story.',
    icon: Film,
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=600&q=80',
  },
  {
    id: '3',
    title: 'Traditional Videography',
    description: 'Classic video coverage of all ceremonies preserving every precious moment in high definition.',
    icon: Video,
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
  },
  {
    id: '4',
    title: 'Traditional Photography',
    description: 'Timeless photographs capturing the essence of your special day with artistic composition.',
    icon: Camera,
    image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&q=80',
  },
  {
    id: '5',
    title: 'Drone Coverage',
    description: 'Stunning aerial shots of your venue and celebration, adding a cinematic perspective.',
    icon: Plane,
    image: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&q=80',
  },
  {
    id: '6',
    title: 'Cinematic Video',
    description: 'Movie-style wedding films with professional cinematography and emotional storytelling.',
    icon: Film,
    image: 'https://images.unsplash.com/photo-1518173946687-a4c036bc9020?w=600&q=80',
  },
  {
    id: '7',
    title: 'Candid Photography',
    description: 'Natural, unposed moments captured beautifully, revealing genuine emotions and connections.',
    icon: ImageIcon,
    image: 'https://images.unsplash.com/photo-1605117882932-f9e32b03fea9?w=600&q=80',
  },
  {
    id: '8',
    title: '3D Wedding Invitation',
    description: 'Digital animated wedding invitations with stunning 3D effects and personalized designs.',
    icon: FileImage,
    image: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80',
  },
];

interface ServicesSectionProps {
  services?: Service[];
}

const ServicesSection: React.FC<ServicesSectionProps> = ({ services }) => {
  const displayServices = services?.length ? services : defaultServices;

  return (
    <section className="bg-charcoal py-24">
      <SectionContainer>
        <SectionHeader
          title="Our Services"
          subtitle="We offer a comprehensive range of photography and videography services to capture your most cherished moments"
        />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayServices.slice(0, 8).map((service, index) => {
            const IconComponent = (defaultServices.find(s => s.title === service.title)?.icon) || Camera;
            const imageUrl = typeof service === 'object' && 'image' in service 
              ? (service as any).image 
              : defaultServices.find(s => s.title === service.title)?.image || defaultServices[index % defaultServices.length].image;

            return (
              <AnimatedCard
                key={service.id}
                delay={index * 0.1}
                className="group"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <div className="p-2 rounded-lg bg-primary/20 backdrop-blur-sm inline-block">
                      <IconComponent className="text-primary" size={24} />
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                  {service.price && (
                    <p className="mt-3 text-primary font-semibold">
                      ₹{service.price.toLocaleString()}
                    </p>
                  )}
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      </SectionContainer>
    </section>
  );
};

export default ServicesSection;
