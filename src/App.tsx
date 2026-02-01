import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Layouts
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import StudioAdminLayout from "./layouts/StudioAdminLayout";

// Super Admin Pages
import SuperAdminDashboard from "./pages/super-admin/Dashboard";

// Studio Admin Pages
import StudioAdminDashboard from "./pages/admin/Dashboard";

const queryClient = new QueryClient();

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
              <Route path="settings" element={<StudioAdminDashboard />} />
              <Route path="pages" element={<StudioAdminDashboard />} />
              <Route path="services" element={<StudioAdminDashboard />} />
              <Route path="portfolio" element={<StudioAdminDashboard />} />
              <Route path="bookings" element={<StudioAdminDashboard />} />
              <Route path="albums" element={<StudioAdminDashboard />} />
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
