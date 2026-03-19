import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Image, Users, TrendingUp, Eye, Settings, Plus, Upload } from 'lucide-react';
import { StatCard } from '@/components/ui/shared';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Booking } from '@/types/database';

const StudioDashboard: React.FC = () => {
  const { studio } = useAuth();
  const [bookingsCount, setBookingsCount] = useState(0);
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studio?.id) {
      fetchDashboardData();
    }
  }, [studio?.id]);

  const fetchDashboardData = async () => {
    if (!studio?.id) return;

    try {
      // Fetch bookings count
      const { count: bookingsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('studio_id', studio.id);

      // Fetch portfolio albums count
      const { count: portfolioCount } = await supabase
        .from('portfolio_albums')
        .select('*', { count: 'exact', head: true })
        .eq('studio_id', studio.id);

      // Fetch recent bookings
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('studio_id', studio.id)
        .order('created_at', { ascending: false })
        .limit(3);

      setBookingsCount(bookingsCount || 0);
      setPortfolioCount(portfolioCount || 0);
      setRecentBookings((bookings || []) as Booking[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Total Bookings', value: bookingsCount.toString(), icon: <Calendar size={24} /> },
    { label: 'Portfolio Albums', value: portfolioCount.toString(), icon: <Image size={24} /> },
    { label: 'Website Visitors', value: '0', icon: <Users size={24} /> },
    { label: 'This Month', value: '0%', icon: <TrendingUp size={24} /> },
  ];

  const quickActions = [
    { label: 'Create Event', icon: Plus, href: '/dashboard/albums' },
    { label: 'Upload Photos', icon: Upload, href: '/dashboard/find-photos' },
    { label: 'Manage Bookings', icon: Calendar, href: '/dashboard/bookings' },
    { label: 'Add Portfolio', icon: Image, href: '/dashboard/portfolio' },
    { label: 'View Website', icon: Eye, href: `/@${studio?.slug}` },
    { label: 'Settings', icon: Settings, href: '/dashboard/settings' },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Welcome, {studio?.name || 'Studio'}
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your studio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard value={stat.value} label={stat.label} icon={stat.icon} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="admin-card">
          <h2 className="font-display text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                {...(action.label === 'View Website' ? { target: '_blank' } : {})}
              >
                <action.icon size={20} className="text-primary" />
                <span className="font-medium text-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h2 className="font-display text-xl font-semibold mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {recentBookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="mx-auto mb-3" size={40} />
                <p>No bookings yet</p>
                <p className="text-sm mt-1">Bookings will appear here once clients submit requests</p>
              </div>
            ) : (
              recentBookings.map((booking, i) => (
                <Link
                  key={booking.id}
                  to="/dashboard/bookings"
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground">{booking.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.event_type || 'Event'} • {new Date(booking.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    booking.status === 'confirmed' ? 'bg-success/20 text-success' :
                    booking.status === 'pending' ? 'bg-warning/20 text-warning' :
                    booking.status === 'completed' ? 'bg-info/20 text-info' :
                    'bg-destructive/20 text-destructive'
                  }`}>
                    {booking.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioDashboard;
