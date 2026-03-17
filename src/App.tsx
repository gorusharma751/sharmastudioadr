import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import NotFound from "./pages/NotFound";

// Marketing Pages
import MarketingLanding from "./pages/marketing/MarketingLanding";
import FeaturesPage from "./pages/marketing/FeaturesPage";
import PricingPage from "./pages/marketing/PricingPage";

// Auth Pages
import LoginSelectorPage from "./pages/LoginSelectorPage";
import AdminAuthPage from "./pages/AdminAuthPage";
import StudioAuthPage from "./pages/StudioAuthPage";

// Public Studio Pages
import Index from "./pages/Index";
import ServicesPage from "./pages/public/ServicesPage";
import PortfolioPage from "./pages/public/PortfolioPage";
import AlbumDetailPage from "./pages/public/AlbumDetailPage";
import BookingPage from "./pages/public/BookingPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import ProgramAlbumPage from "./pages/public/ProgramAlbumPage";
import FindPhotosPage from "./pages/public/FindPhotosPage";
import WeddingInvitationPage from "./pages/public/WeddingInvitationPage";
import CustomPage from "./pages/public/CustomPage";
import DigitalAlbumPage from "./pages/public/DigitalAlbumPage";

// Guest Photo Finder
import FindPhotosEventPage from "./pages/public/FindPhotosEventPage";
import GuestFindPhotosPage from "./pages/public/GuestFindPhotosPage";

// Layouts
import StudioAdminLayout from "./layouts/StudioAdminLayout";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import PublicStudioLayout from "./layouts/PublicStudioLayout";

// Studio Admin Pages (dashboard)
import StudioDashboard from "./pages/admin/Dashboard";
import ServicesManager from "./pages/admin/ServicesManager";
import PortfolioManager from "./pages/admin/PortfolioManager";
import BookingsManager from "./pages/admin/BookingsManager";
import PagesManager from "./pages/admin/PagesManager";
import ProgramsManager from "./pages/admin/ProgramsManager";
import SettingsManager from "./pages/admin/SettingsManager";
import FindPhotosManager from "./pages/admin/FindPhotosManager";
import InvitationsManager from "./pages/admin/InvitationsManager";
import LeadsManager from "./pages/admin/LeadsManager";
import AlbumSettingsManager from "./pages/admin/AlbumSettingsManager";

// Super Admin Pages
import SuperAdminDashboard from "./pages/super-admin/Dashboard";
import StudiosManager from "./pages/super-admin/StudiosManager";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ==================== */}
            {/* MARKETING ROUTES     */}
            {/* ==================== */}
            <Route path="/" element={<MarketingLanding />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />

            {/* ==================== */}
            {/* AUTH ROUTES          */}
            {/* ==================== */}
            <Route path="/login" element={<LoginSelectorPage />} />
            <Route path="/login/studio" element={<StudioAuthPage />} />
            <Route path="/login/admin" element={<AdminAuthPage />} />

            {/* ==================== */}
            {/* SUPER ADMIN ROUTES   */}
            {/* ==================== */}
            <Route path="/admin" element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="studios" element={<StudiosManager />} />
            </Route>

            {/* ==================== */}
            {/* STUDIO DASHBOARD     */}
            {/* ==================== */}
            <Route path="/dashboard" element={<StudioAdminLayout />}>
              <Route index element={<StudioDashboard />} />
              <Route path="settings" element={<SettingsManager />} />
              <Route path="pages" element={<PagesManager />} />
              <Route path="services" element={<ServicesManager />} />
              <Route path="portfolio" element={<PortfolioManager />} />
              <Route path="bookings" element={<BookingsManager />} />
              <Route path="albums" element={<ProgramsManager />} />
              <Route path="album-settings" element={<AlbumSettingsManager />} />
              <Route path="leads" element={<LeadsManager />} />
              <Route path="find-photos" element={<FindPhotosManager />} />
              <Route path="invitations" element={<InvitationsManager />} />
            </Route>

            {/* ==================== */}
            {/* GUEST PHOTO FINDER   */}
            {/* ==================== */}
            <Route path="/find-photos" element={<GuestFindPhotosPage />} />
            <Route path="/find-photos/:eventId" element={<FindPhotosEventPage />} />

            {/* ==================== */}
            {/* PUBLIC STUDIO ROUTES */}
            {/* ==================== */}
            <Route path="/:studioHandle" element={<PublicStudioLayout />}>
              <Route index element={<Index />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="portfolio" element={<PortfolioPage />} />
              <Route path="portfolio/:id" element={<AlbumDetailPage />} />
              <Route path="booking" element={<BookingPage />} />
              <Route path="about" element={<AboutPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="album/:id" element={<ProgramAlbumPage />} />
              <Route path="find-photos" element={<FindPhotosPage />} />
              <Route path="invitation" element={<WeddingInvitationPage />} />
              <Route path="page/:slug" element={<CustomPage />} />
              <Route path="digital-album/:id" element={<DigitalAlbumPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
