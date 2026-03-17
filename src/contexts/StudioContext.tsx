import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Studio, StudioSettings, Service, PortfolioAlbum, Page } from '@/types/database';

interface StudioContextType {
  studio: Studio | null;
  settings: StudioSettings | null;
  services: Service[];
  portfolioAlbums: PortfolioAlbum[];
  pages: Page[];
  loading: boolean;
  error: string | null;
  refreshStudio: () => Promise<void>;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

interface StudioProviderProps {
  children: React.ReactNode;
  studioSlug?: string;
  studioId?: string;
}

export const StudioProvider: React.FC<StudioProviderProps> = ({ 
  children, 
  studioSlug, 
  studioId 
}) => {
  const [studio, setStudio] = useState<Studio | null>(null);
  const [settings, setSettings] = useState<StudioSettings | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [portfolioAlbums, setPortfolioAlbums] = useState<PortfolioAlbum[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStudioData = async () => {
    try {
      setLoading(true);
      setError(null);

      let studioQuery = supabase
        .from('studios')
        .select('*, saas_plans(*)');

      if (studioSlug) {
        studioQuery = studioQuery.eq('slug', studioSlug);
      } else if (studioId) {
        studioQuery = studioQuery.eq('id', studioId);
      } else {
        setError('No studio identifier provided');
        setLoading(false);
        return;
      }

      const { data: studioData, error: studioError } = await studioQuery.maybeSingle();

      if (studioError) {
        console.error('Error fetching studio:', studioError);
        setError('Failed to load studio');
        setLoading(false);
        return;
      }
      if (!studioData) {
        setError('Studio not found');
        setLoading(false);
        return;
      }

      setStudio(studioData as Studio);

      // Fetch studio settings
      const { data: settingsData } = await supabase
        .from('studio_settings')
        .select('*')
        .eq('studio_id', studioData.id)
        .single();

      if (settingsData) {
        setSettings(settingsData as StudioSettings);
      }

      // Fetch services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('studio_id', studioData.id)
        .eq('is_visible', true)
        .order('sort_order');

      if (servicesData) {
        setServices(servicesData as Service[]);
      }

      // Fetch portfolio albums
      const { data: albumsData } = await supabase
        .from('portfolio_albums')
        .select('*')
        .eq('studio_id', studioData.id)
        .eq('is_published', true)
        .order('sort_order');

      if (albumsData) {
        setPortfolioAlbums(albumsData as PortfolioAlbum[]);
      }

      // Fetch pages
      const { data: pagesData } = await supabase
        .from('pages')
        .select('*')
        .eq('studio_id', studioData.id)
        .eq('is_published', true)
        .order('sort_order');

      if (pagesData) {
        setPages(pagesData as Page[]);
      }
    } catch (err) {
      console.error('Error fetching studio data:', err);
      setError('Failed to load studio data');
    } finally {
      setLoading(false);
    }
  };

  const refreshStudio = async () => {
    await fetchStudioData();
  };

  useEffect(() => {
    if (studioSlug || studioId) {
      fetchStudioData();
    }
  }, [studioSlug, studioId]);

  return (
    <StudioContext.Provider
      value={{
        studio,
        settings,
        services,
        portfolioAlbums,
        pages,
        loading,
        error,
        refreshStudio,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (context === undefined) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
};
