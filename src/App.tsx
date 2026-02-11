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
import DigitalAlbumPage from "./pages/public/DigitalAlbumPage";

// Layouts
import StudioAdminLayout from "./layouts/StudioAdminLayout";
import UserLayout from "./layouts/UserLayout";

// Studio Admin Pages
import StudioAdminDashboard from "./pages/admin/Dashboard";
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

// User Pages
import UserDashboard from "./pages/user/UserDashboard";
import UserAlbums from "./pages/user/UserAlbums";
import UserShare from "./pages/user/UserShare";

const queryClient = new QueryClient();

// Wrapper for public pages with StudioProvider
const PublicPageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StudioProvider studioSlug="sharma-studio">
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
            <Route path="/" element={<PublicPageWrapper><Index /></PublicPageWrapper>} />
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
            <Route path="/digital-album/:id" element={<DigitalAlbumPage />} />

            {/* User Routes (Customer Portal) */}
            <Route path="/user" element={<UserLayout />}>
              <Route index element={<UserDashboard />} />
              <Route path="albums" element={<UserAlbums />} />
              <Route path="share" element={<UserShare />} />
              <Route path="invitations" element={<UserDashboard />} />
              <Route path="bookings" element={<UserDashboard />} />
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
              <Route path="leads" element={<LeadsManager />} />
              <Route path="album-settings" element={<AlbumSettingsManager />} />
              <Route path="find-photos" element={<FindPhotosManager />} />
              <Route path="invitations" element={<InvitationsManager />} />
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
