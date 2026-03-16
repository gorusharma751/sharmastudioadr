import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StudioProvider } from "@/contexts/StudioContext";

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Auth Pages
import AdminAuthPage from "./pages/AdminAuthPage";
import StudioAuthPage from "./pages/StudioAuthPage";

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
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import UserLayout from "./layouts/UserLayout";

// Studio Admin Pages (used inside /studio routes)
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
            {/* ==================== */}
            {/* PUBLIC ROUTES        */}
            {/* ==================== */}
            <Route path="/" element={<PublicPageWrapper><Index /></PublicPageWrapper>} />
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

            {/* ==================== */}
            {/* AUTH ROUTES          */}
            {/* ==================== */}
            <Route path="/admin/login" element={<AdminAuthPage />} />
            <Route path="/studio/login" element={<StudioAuthPage />} />

            {/* ==================== */}
            {/* SUPER ADMIN ROUTES   */}
            {/* ==================== */}
            <Route path="/admin" element={<SuperAdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="studios" element={<StudiosManager />} />
            </Route>

            {/* ==================== */}
            {/* STUDIO ADMIN ROUTES  */}
            {/* ==================== */}
            <Route path="/studio" element={<StudioAdminLayout />}>
              <Route index element={<StudioDashboard />} />
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

            {/* ==================== */}
            {/* USER PORTAL ROUTES   */}
            {/* ==================== */}
            <Route path="/user" element={<UserLayout />}>
              <Route index element={<UserDashboard />} />
              <Route path="albums" element={<UserAlbums />} />
              <Route path="share" element={<UserShare />} />
              <Route path="invitations" element={<UserDashboard />} />
              <Route path="bookings" element={<UserDashboard />} />
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
