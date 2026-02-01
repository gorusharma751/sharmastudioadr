import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StudioProvider } from "@/contexts/StudioContext";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Public Pages
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

// Layouts
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import StudioAdminLayout from "./layouts/StudioAdminLayout";

// Super Admin Pages
import SuperAdminDashboard from "./pages/super-admin/Dashboard";

// Studio Admin Pages
import StudioAdminDashboard from "./pages/admin/Dashboard";
import ServicesManager from "./pages/admin/ServicesManager";
import PortfolioManager from "./pages/admin/PortfolioManager";
import BookingsManager from "./pages/admin/BookingsManager";
import PagesManager from "./pages/admin/PagesManager";
import ProgramsManager from "./pages/admin/ProgramsManager";
import SettingsManager from "./pages/admin/SettingsManager";

const queryClient = new QueryClient();

// Wrapper for public pages with StudioProvider
const PublicPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StudioProvider studioSlug="demo">
    {children}
  </StudioProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/services" element={<PublicPageWrapper><ServicesPage /></PublicPageWrapper>} />
            <Route path="/portfolio" element={<PublicPageWrapper><PortfolioPage /></PublicPageWrapper>} />
            <Route path="/portfolio/:id" element={<PublicPageWrapper><AlbumDetailPage /></PublicPageWrapper>} />
            <Route path="/booking" element={<PublicPageWrapper><BookingPage /></PublicPageWrapper>} />
            <Route path="/about" element={<PublicPageWrapper><AboutPage /></PublicPageWrapper>} />
            <Route path="/contact" element={<PublicPageWrapper><ContactPage /></PublicPageWrapper>} />
            <Route path="/album/:id" element={<PublicPageWrapper><ProgramAlbumPage /></PublicPageWrapper>} />
            <Route path="/find-photos" element={<PublicPageWrapper><FindPhotosPage /></PublicPageWrapper>} />
            <Route path="/invitation" element={<PublicPageWrapper><WeddingInvitationPage /></PublicPageWrapper>} />
            <Route path="/page/:slug" element={<PublicPageWrapper><CustomPage /></PublicPageWrapper>} />

            {/* Super Admin Routes */}
            <Route path="/super-admin" element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="studios" element={<SuperAdminDashboard />} />
              <Route path="plans" element={<SuperAdminDashboard />} />
              <Route path="users" element={<SuperAdminDashboard />} />
              <Route path="analytics" element={<SuperAdminDashboard />} />
              <Route path="settings" element={<SuperAdminDashboard />} />
            </Route>

            {/* Studio Admin Routes */}
            <Route path="/admin" element={<StudioAdminLayout />}>
              <Route index element={<StudioAdminDashboard />} />
              <Route path="settings" element={<SettingsManager />} />
              <Route path="pages" element={<PagesManager />} />
              <Route path="services" element={<ServicesManager />} />
              <Route path="portfolio" element={<PortfolioManager />} />
              <Route path="bookings" element={<BookingsManager />} />
              <Route path="albums" element={<ProgramsManager />} />
              <Route path="find-photos" element={<StudioAdminDashboard />} />
              <Route path="invitations" element={<StudioAdminDashboard />} />
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
