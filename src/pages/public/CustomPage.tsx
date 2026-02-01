import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer } from '@/components/ui/shared';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useStudio } from '@/contexts/StudioContext';
import { Page, PageSection } from '@/types/database';

const CustomPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { studio, pages } = useStudio();
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug || !studio?.id) return;

      // First check if page exists in context
      const contextPage = pages.find(p => p.slug === slug);
      if (contextPage) {
        setPage(contextPage);
      }

      try {
        const { data: pageData } = await supabase
          .from('pages')
          .select('*')
          .eq('studio_id', studio.id)
          .eq('slug', slug)
          .eq('is_published', true)
          .single();

        if (pageData) {
          setPage(pageData as Page);

          const { data: sectionsData } = await supabase
            .from('page_sections')
            .select('*')
            .eq('page_id', pageData.id)
            .order('sort_order');

          if (sectionsData) {
            setSections(sectionsData as PageSection[]);
          }
        }
      } catch (error) {
        console.error('Error fetching page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug, studio?.id, pages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName={studio?.name || 'Studio'} />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <Skeleton className="h-12 w-64 mb-8" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </SectionContainer>
        </div>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName={studio?.name || 'Studio'} />
        <div className="pt-32 pb-20">
          <SectionContainer>
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
              <p className="text-muted-foreground mb-8">
                The page you're looking for doesn't exist or has been removed.
              </p>
              <button
                onClick={() => navigate('/')}
                className="text-primary underline hover:no-underline"
              >
                Return to Home
              </button>
            </div>
          </SectionContainer>
        </div>
        <Footer studioName={studio?.name || 'Studio'} />
      </div>
    );
  }

  const renderSection = (section: PageSection, index: number) => {
    const content = section.content as Record<string, any>;

    switch (section.section_type) {
      case 'hero':
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative py-24 text-center"
            style={{
              backgroundImage: content.backgroundImage ? `url(${content.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {content.backgroundImage && (
              <div className="absolute inset-0 bg-background/80" />
            )}
            <div className="relative z-10">
              <h1 className="font-display text-4xl md:text-6xl font-bold text-foreground mb-4">
                {content.title || page.title}
              </h1>
              {content.subtitle && (
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  {content.subtitle}
                </p>
              )}
            </div>
          </motion.div>
        );

      case 'text':
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="py-16"
          >
            <div className="glass-card p-8 md:p-12">
              {content.heading && (
                <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">
                  {content.heading}
                </h2>
              )}
              <div className="prose prose-invert max-w-none">
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {content.body || 'Content goes here...'}
                </p>
              </div>
            </div>
          </motion.div>
        );

      case 'gallery':
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="py-16"
          >
            {content.title && (
              <h2 className="font-display text-2xl md:text-3xl font-bold text-center mb-8">
                {content.title}
              </h2>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {(content.images || []).map((image: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="aspect-square rounded-xl overflow-hidden"
                >
                  <img
                    src={image}
                    alt={`Gallery ${i + 1}`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        );

      case 'cta':
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="py-16 text-center"
          >
            <div className="glass-card p-12">
              <h2 className="font-display text-3xl font-bold mb-4">
                {content.title || 'Ready to get started?'}
              </h2>
              {content.description && (
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                  {content.description}
                </p>
              )}
              {content.buttonText && (
                <button
                  onClick={() => content.buttonLink && navigate(content.buttonLink)}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  {content.buttonText}
                </button>
              )}
            </div>
          </motion.div>
        );

      case 'testimonial':
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="py-16"
          >
            <div className="glass-card p-12 text-center">
              <blockquote className="font-display text-2xl italic text-foreground mb-6">
                "{content.quote || 'Add your testimonial here...'}"
              </blockquote>
              {content.author && (
                <div>
                  <p className="font-semibold">{content.author}</p>
                  {content.role && (
                    <p className="text-sm text-muted-foreground">{content.role}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );

      default:
        return (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="py-16"
          >
            <div className="glass-card p-8">
              <pre className="text-sm text-muted-foreground overflow-auto">
                {JSON.stringify(content, null, 2)}
              </pre>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName={studio?.name || 'Studio'} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-24 pb-20"
      >
        <SectionContainer>
          {sections.length > 0 ? (
            sections.map((section, index) => renderSection(section, index))
          ) : (
            <div className="py-16 text-center">
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
                {page.title}
              </h1>
              <p className="text-muted-foreground">
                This page is being built. Check back soon!
              </p>
            </div>
          )}
        </SectionContainer>
      </motion.div>
      
      <Footer studioName={studio?.name || 'Studio'} />
    </div>
  );
};

export default CustomPage;
