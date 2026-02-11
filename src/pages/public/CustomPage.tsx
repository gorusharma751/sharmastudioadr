import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer } from '@/components/ui/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useStudio } from '@/contexts/StudioContext';

interface CustomPageData {
  id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  meta_title: string | null;
  meta_description: string | null;
}

const CustomPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { studio } = useStudio();
  const [page, setPage] = useState<CustomPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug || !studio?.id) return;
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('id, title, slug, content, is_published, meta_title, meta_description')
          .eq('studio_id', studio.id)
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setPage(data as CustomPageData);
          // SEO: set document title and meta description
          document.title = (data as any).meta_title || (data as any).title || 'Page';
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc && (data as any).meta_description) {
            metaDesc.setAttribute('content', (data as any).meta_description);
          }
        }
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug, studio?.id]);

  const studioName = studio?.name || 'Sharma Digital Studio';

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName={studioName} />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <Skeleton className="h-10 w-64 mb-6" />
            <Skeleton className="h-4 w-full mb-3" />
            <Skeleton className="h-4 w-3/4 mb-3" />
            <Skeleton className="h-4 w-5/6" />
          </SectionContainer>
        </div>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName={studioName} />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <h2 className="text-3xl font-display font-bold mb-4">Page Not Found</h2>
              <p className="text-muted-foreground mb-8">
                The page you're looking for doesn't exist or has been removed.
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-primary underline hover:no-underline font-medium"
              >
                Return to Home
              </button>
            </motion.div>
          </SectionContainer>
        </div>
        <Footer studioName={studioName} />
      </div>
    );
  }

  // Split content into paragraphs for rendering
  const paragraphs = page.content
    ? page.content.split('\n').filter(p => p.trim() !== '')
    : [];

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName={studioName} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-28 pb-20"
      >
        <SectionContainer>
          {/* Page Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-8 text-center"
          >
            {page.title}
          </motion.h1>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-24 h-1 bg-primary mx-auto mb-12 rounded-full"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="max-w-3xl mx-auto"
          >
            {paragraphs.length > 0 ? (
              <div className="space-y-5">
                {paragraphs.map((paragraph, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="text-muted-foreground text-base sm:text-lg leading-relaxed"
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground text-lg">
                This page is being built. Check back soon!
              </p>
            )}
          </motion.div>
        </SectionContainer>
      </motion.div>

      <Footer studioName={studioName} />
    </div>
  );
};

export default CustomPage;
