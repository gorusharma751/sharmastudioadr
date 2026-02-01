import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, QrCode, Calendar, Share2 } from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useStudio } from '@/contexts/StudioContext';
import { ProgramAlbum, ProgramImage } from '@/types/database';

const ProgramAlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { studio } = useStudio();
  const [album, setAlbum] = useState<ProgramAlbum | null>(null);
  const [images, setImages] = useState<ProgramImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!id) return;
      
      try {
        const { data: albumData } = await supabase
          .from('program_albums')
          .select('*')
          .eq('id', id)
          .single();

        if (albumData) {
          setAlbum(albumData as ProgramAlbum);

          const { data: imagesData } = await supabase
            .from('program_images')
            .select('*')
            .eq('program_album_id', id)
            .order('sort_order');

          if (imagesData) {
            setImages(imagesData as ProgramImage[]);
          }
        }
      } catch (error) {
        console.error('Error fetching program album:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrev();
    if (e.key === 'ArrowRight') handleNext();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images]);

  // Auto-advance slideshow
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
    }),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName={studio?.name || 'Studio'} />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <Skeleton className="h-12 w-64 mb-8 mx-auto" />
            <Skeleton className="aspect-video max-w-4xl mx-auto rounded-xl" />
          </SectionContainer>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName={studio?.name || 'Studio'} />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4">Album Not Found</h2>
              <p className="text-muted-foreground">This album may have been removed or is not available.</p>
            </div>
          </SectionContainer>
        </div>
        <Footer studioName={studio?.name || 'Studio'} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName={studio?.name || 'Studio'} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-32 pb-20"
      >
        <SectionContainer>
          {/* Album Header */}
          <div className="text-center mb-12">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              {album.name}
            </motion.h1>
            {album.description && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-muted-foreground max-w-2xl mx-auto mb-4"
              >
                {album.description}
              </motion.p>
            )}
            {album.event_date && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2 text-primary"
              >
                <Calendar size={18} />
                <span>{new Date(album.event_date).toLocaleDateString('en-IN', { 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}</span>
              </motion.div>
            )}
          </div>

          {/* 3D Slideshow */}
          {images.length > 0 ? (
            <div className="relative max-w-5xl mx-auto">
              <div className="aspect-video relative overflow-hidden rounded-2xl bg-charcoal perspective-1000">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.3 },
                      rotateY: { duration: 0.5 },
                    }}
                    className="absolute inset-0"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <img
                      src={images[currentIndex].image_url}
                      alt={images[currentIndex].caption || `Photo ${currentIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                >
                  <ChevronRight size={28} />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white text-sm z-10">
                  {currentIndex + 1} / {images.length}
                </div>
              </div>

              {/* Caption */}
              {images[currentIndex]?.caption && (
                <motion.p
                  key={`caption-${currentIndex}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mt-4 text-muted-foreground"
                >
                  {images[currentIndex].caption}
                </motion.p>
              )}

              {/* Thumbnail Navigation */}
              <div className="flex gap-2 justify-center mt-8 overflow-x-auto py-2">
                {images.map((image, index) => (
                  <motion.button
                    key={image.id}
                    onClick={() => {
                      setDirection(index > currentIndex ? 1 : -1);
                      setCurrentIndex(index);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                      index === currentIndex
                        ? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                        : 'opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.image_url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No photos in this album yet.</p>
            </div>
          )}

          {/* Share / QR Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-4"
          >
            <Button variant="outline" className="gap-2">
              <Share2 size={18} />
              Share Album
            </Button>
            {album.qr_code_url && (
              <Button variant="outline" className="gap-2">
                <QrCode size={18} />
                View QR Code
              </Button>
            )}
          </motion.div>
        </SectionContainer>
      </motion.div>
      
      <Footer studioName={studio?.name || 'Studio'} />
    </div>
  );
};

export default ProgramAlbumPage;
