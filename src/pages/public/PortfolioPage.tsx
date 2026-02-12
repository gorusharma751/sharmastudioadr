import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, Images } from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer, SectionHeader, AnimatedCard } from '@/components/ui/shared';
import { useStudio } from '@/contexts/StudioContext';
import { Skeleton } from '@/components/ui/skeleton';

const PortfolioPage: React.FC = () => {
  const { studio, settings, portfolioAlbums, loading } = useStudio();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName="Loading..." />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
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
            title="Our Portfolio"
            subtitle="Browse through our collection of stunning photography and videography work capturing love stories and precious moments."
          />

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolioAlbums.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                onClick={() => navigate(`/portfolio/${album.id}`)}
                className="cursor-pointer"
              >
                <AnimatedCard className="group overflow-hidden h-full">
                  <div className="relative h-72 overflow-hidden">
                    {album.cover_image_url ? (
                      <motion.img
                        src={album.cover_image_url}
                        alt={album.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Images className="text-primary/50" size={64} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {album.category && (
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 text-xs font-medium bg-primary/90 text-primary-foreground rounded-full">
                          {album.category}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {album.name}
                    </h3>
                    {album.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {album.description}
                      </p>
                    )}
                    <motion.div 
                      className="mt-4 flex items-center gap-2 text-primary text-sm font-medium"
                      whileHover={{ x: 5 }}
                    >
                      <Camera size={16} />
                      <span>View Album</span>
                    </motion.div>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </div>

          {portfolioAlbums.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <Images className="mx-auto text-primary mb-4" size={48} />
              <h3 className="text-xl font-semibold mb-2">Portfolio Coming Soon</h3>
              <p className="text-muted-foreground">Our amazing work will be showcased here.</p>
            </motion.div>
          )}
        </SectionContainer>
      </motion.div>
      
      <Footer studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} settings={settings} />
    </div>
  );
};

export default PortfolioPage;
