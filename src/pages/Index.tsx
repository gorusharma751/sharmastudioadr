import React from "react";
import GlassNavbar from "@/components/GlassNavbar";
import HeroSection from "@/components/public/HeroSection";
import ServicesSection from "@/components/public/ServicesSection";
import PortfolioSection from "@/components/public/PortfolioSection";
import BookingSection from "@/components/public/BookingSection";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useStudio } from "@/contexts/StudioContext";

const Index: React.FC = () => {
  const navigate = useNavigate();
  const { studio, settings } = useStudio();

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar
        studioName={studio?.name || "Studio"}
        logoUrl={settings?.logo_url || undefined}
        studioSlug={studio?.slug}
        studioId={studio?.id}
        showAuth={true}
        onAuthClick={() => navigate("/login")}
        settings={settings}
      />
      <HeroSection />
      <ServicesSection />
      <PortfolioSection />
      <BookingSection studioId={studio?.id || "demo"} />
      <Footer studioName={studio?.name || "Studio"} logoUrl={settings?.logo_url || undefined} studioSlug={studio?.slug} settings={settings} />
    </div>
  );
};

export default Index;
