import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { StudioProvider } from '@/contexts/StudioContext';
import NotFound from '@/pages/NotFound';

const PublicStudioLayout: React.FC = () => {
  const { studioHandle } = useParams<{ studioHandle: string }>();

  // Validate @ prefix
  if (!studioHandle?.startsWith('@')) {
    return <NotFound />;
  }

  const studioSlug = studioHandle.slice(1); // Remove @ prefix

  if (!studioSlug) {
    return <NotFound />;
  }

  return (
    <StudioProvider studioSlug={studioSlug}>
      <Outlet />
    </StudioProvider>
  );
};

export default PublicStudioLayout;
