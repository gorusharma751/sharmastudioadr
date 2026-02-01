import React from 'react';
import GlassNavbar from '@/components/GlassNavbar';
import HeroSection from '@/components/public/HeroSection';
import ServicesSection from '@/components/public/ServicesSection';
import PortfolioSection from '@/components/public/PortfolioSection';
import BookingSection from '@/components/public/BookingSection';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';

const Index: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar
        studioName="StudioSaaS"
        showAuth={true}
        onAuthClick={() => navigate('/auth')}
      />
      <HeroSection />
      <ServicesSection />
      <PortfolioSection />
      <BookingSection studioId="demo" />
      <Footer studioName="StudioSaaS" />
    </div>
  );
};

export default Index;
