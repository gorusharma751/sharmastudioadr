import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Grid, Rows } from 'lucide-react';
import { SectionContainer, SectionHeader, AnimatedCard } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { PortfolioAlbum } from '@/types/database';
import { cn } from '@/lib/utils';

// Default portfolio images
const defaultAlbums = [
  {
    id: '1',
    name: 'Royal Wedding',
    category: 'Wedding',
    cover_image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80',
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=80',
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=80',
    ],
  },
  {
    id: '2',
    name: 'Sunset Ceremony',
    category: 'Wedding',
    cover_image_url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
    images: [],
  },
  {
    id: '3',
    name: 'Elegant Reception',
    category: 'Events',
    cover_image_url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
    images: [],
  },
  {
    id: '4',
    name: 'Garden Party',
    category: 'Events',
    cover_image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
    images: [],
  },
  {
    id: '5',
    name: 'Studio Portraits',
    category: 'Portraits',
    cover_image_url: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=800&q=80',
    images: [],
  },
  {
    id: '6',
    name: 'Family Moments',
    category: 'Portraits',
    cover_image_url: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80',
    images: [],
  },
];

const categories = ['All', 'Wedding', 'Events', 'Portraits', 'Commercial'];

interface PortfolioSectionProps {
  albums?: PortfolioAlbum[];
}

const PortfolioSection: React.FC<PortfolioSectionProps> = ({ albums }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'masonry'>('grid');

  const displayAlbums = albums?.length ? albums : defaultAlbums;
  
  const filteredAlbums = selectedCategory === 'All'
    ? displayAlbums
    : displayAlbums.filter(album => album.category === selectedCategory);

  const allImages = filteredAlbums.flatMap(album => 
    album.cover_image_url ? [album.cover_image_url] : []
  );

  const handlePrevImage = () => {
    setCurrentImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1);
    setSelectedImage(allImages[currentImageIndex === 0 ? allImages.length - 1 : currentImageIndex - 1]);
  };

  const handleNextImage = () => {
    setCurrentImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1);
    setSelectedImage(allImages[currentImageIndex === allImages.length - 1 ? 0 : currentImageIndex + 1]);
  };

  return (
    <section className="py-24">
      <SectionContainer>
        <SectionHeader
          title="Our Portfolio"
          subtitle="Browse through our collection of stunning photography and videography work"
        />

        {/* Category Filter */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              className={cn(
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'btn-outline-gold'
              )}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </Button>
          ))}
          
          <div className="ml-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'text-primary' : 'text-muted-foreground'}
            >
              <Grid size={20} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('masonry')}
              className={viewMode === 'masonry' ? 'text-primary' : 'text-muted-foreground'}
            >
              <Rows size={20} />
            </Button>
          </div>
        </div>

        {/* Portfolio Grid */}
        <motion.div
          layout
          className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'columns-1 md:columns-2 lg:columns-3 space-y-6'
          )}
        >
          <AnimatePresence mode="popLayout">
            {filteredAlbums.map((album, index) => (
              <motion.div
                key={album.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={viewMode === 'masonry' ? 'break-inside-avoid' : ''}
              >
                <div
                  className="group relative rounded-xl overflow-hidden cursor-pointer"
                  onClick={() => {
                    if (album.cover_image_url) {
                      setSelectedImage(album.cover_image_url);
                      setCurrentImageIndex(allImages.indexOf(album.cover_image_url));
                    }
                  }}
                >
                  <img
                    src={album.cover_image_url || 'https://via.placeholder.com/800x600'}
                    alt={album.name}
                    className={cn(
                      'w-full object-cover transition-transform duration-500 group-hover:scale-105',
                      viewMode === 'grid' ? 'aspect-[4/3]' : 'h-auto'
                    )}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-primary text-sm font-medium mb-1">
                      {album.category || 'Uncategorized'}
                    </span>
                    <h3 className="font-display text-xl font-semibold text-foreground">
                      {album.name}
                    </h3>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Lightbox */}
        <AnimatePresence>
          {selectedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-lg"
              onClick={() => setSelectedImage(null)}
            >
              <button
                className="absolute top-6 right-6 p-2 rounded-full bg-secondary hover:bg-primary transition-colors"
                onClick={() => setSelectedImage(null)}
              >
                <X size={24} />
              </button>
              
              <button
                className="absolute left-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-secondary hover:bg-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevImage();
                }}
              >
                <ChevronLeft size={24} />
              </button>
              
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                src={selectedImage}
                alt="Portfolio"
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
              
              <button
                className="absolute right-6 top-1/2 -translate-y-1/2 p-3 rounded-full bg-secondary hover:bg-primary transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
              >
                <ChevronRight size={24} />
              </button>
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground">
                {currentImageIndex + 1} / {allImages.length}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </SectionContainer>
    </section>
  );
};

export default PortfolioSection;
