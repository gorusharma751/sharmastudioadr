import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, X, Download, Share2 } from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useStudio } from '@/contexts/StudioContext';
import { PortfolioAlbum, PortfolioImage } from '@/types/database';

const AlbumDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { studio, settings } = useStudio();
  const [album, setAlbum] = useState<PortfolioAlbum | null>(null);
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  useEffect(() => {
    const fetchAlbum = async () => {
      if (!id) return;
      
      try {
        const { data: albumData } = await supabase
          .from('portfolio_albums')
          .select('*')
          .eq('id', id)
          .single();

        if (albumData) {
          setAlbum(albumData as PortfolioAlbum);

          const { data: imagesData } = await supabase
            .from('portfolio_images')
            .select('*')
            .eq('album_id', id)
            .order('sort_order');

          if (imagesData) {
            setImages(imagesData as PortfolioImage[]);
          }
        }
      } catch (error) {
        console.error('Error fetching album:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbum();
  }, [id]);

  const handlePrevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedImage === null) return;
    if (e.key === 'ArrowLeft') handlePrevImage();
    if (e.key === 'ArrowRight') handleNextImage();
    if (e.key === 'Escape') setSelectedImage(null);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage, images]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} studioSlug={studio?.slug} studioId={studio?.id} />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          </SectionContainer>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} studioSlug={studio?.slug} studioId={studio?.id} />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4">Album Not Found</h2>
              <Button onClick={() => navigate(`/@${studio?.slug}/portfolio`)}>
                <ArrowLeft className="mr-2" size={18} />
                Back to Portfolio
              </Button>
            </div>
          </SectionContainer>
        </div>
        <Footer studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} settings={settings} studioSlug={studio?.slug} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} studioSlug={studio?.slug} studioId={studio?.id} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-32 pb-20"
      >
        <SectionContainer>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8"
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/@${studio?.slug}/portfolio`)}
              className="mb-4"
            >
              <ArrowLeft className="mr-2" size={18} />
              Back to Portfolio
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
                  {album.name}
                </h1>
                {album.category && (
                  <span className="inline-block mt-2 px-3 py-1 text-sm bg-primary/20 text-primary rounded-full">
                    {album.category}
                  </span>
                )}
                {album.description && (
                  <p className="mt-4 text-muted-foreground max-w-2xl">
                    {album.description}
                  </p>
                )}
              </div>
              <div className="text-muted-foreground">
                {images.length} photos
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedImage(index)}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative"
              >
                <img
                  src={image.image_url}
                  alt={image.caption || `Photo ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
              </motion.div>
            ))}
          </div>

          {images.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No photos in this album yet.</p>
            </div>
          )}
        </SectionContainer>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && images[selectedImage] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors"
            >
              <X size={32} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
              className="absolute left-6 p-3 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full"
            >
              <ChevronLeft size={32} />
            </button>

            <motion.img
              key={selectedImage}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              src={images[selectedImage].image_url}
              alt={images[selectedImage].caption || ''}
              className="max-h-[85vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button
              onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
              className="absolute right-6 p-3 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full"
            >
              <ChevronRight size={32} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
              <span className="text-white/70">
                {selectedImage + 1} / {images.length}
              </span>
              {images[selectedImage].caption && (
                <span className="text-white/50">|</span>
              )}
              {images[selectedImage].caption && (
                <span className="text-white/70">{images[selectedImage].caption}</span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} settings={settings} studioSlug={studio?.slug} />
    </div>
  );
};

export default AlbumDetailPage;
