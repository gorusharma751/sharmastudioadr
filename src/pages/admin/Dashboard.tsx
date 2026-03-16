import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Image, Users, TrendingUp, Eye, Settings, Plus, Upload } from 'lucide-react';
import { StatCard } from '@/components/ui/shared';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';

const StudioDashboard: React.FC = () => {
  const { currentStudio } = useAuth();
  const [bookingCount, setBookingCount] = useState(0);
  const [albumCount, setAlbumCount] = useState(0);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    if (!currentStudio) return;
    const sid = currentStudio.id;

    const fetchData = async () => {
      const [{ count: bc }, { count: ac }, { data: rb }] = await Promise.all([
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('studio_id', sid),
        supabase.from('portfolio_albums').select('id', { count: 'exact', head: true }).eq('studio_id', sid),
        supabase.from('bookings').select('name, event_type, status, created_at').eq('studio_id', sid).order('created_at', { ascending: false }).limit(5),
      ]);
      setBookingCount(bc || 0);
      setAlbumCount(ac || 0);
      setRecentBookings(rb || []);
    };
    fetchData();
  }, [currentStudio]);

  const stats = [
    { label: 'Total Bookings', value: String(bookingCount), icon: <Calendar size={24} /> },
    { label: 'Portfolio Albums', value: String(albumCount), icon: <Image size={24} /> },
    { label: 'Website Visitors', value: '—', icon: <Users size={24} /> },
    { label: 'Growth This Month', value: '—', icon: <TrendingUp size={24} /> },
  ];

  const quickActions = [
    { label: 'Create Event', icon: Plus, href: '/studio/albums' },
    { label: 'Upload Photos', icon: Upload, href: '/studio/find-photos' },
    { label: 'Manage Bookings', icon: Calendar, href: '/studio/bookings' },
    { label: 'Add Portfolio', icon: Image, href: '/studio/portfolio' },
    { label: 'View Website', icon: Eye, href: '/' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Welcome, {currentStudio?.name || 'Studio'}
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your studio</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <StatCard value={stat.value} label={stat.label} icon={stat.icon} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="admin-card">
          <h2 className="font-display text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} to={action.href}
                className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                {...(action.href === '/' ? { target: '_blank' } : {})}>
                <action.icon size={20} className="text-primary" />
                <span className="font-medium text-foreground">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h2 className="font-display text-xl font-semibold mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {recentBookings.length > 0 ? recentBookings.map((booking, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <p className="font-medium text-foreground">{booking.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.event_type || 'Event'}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  booking.status === 'confirmed' ? 'bg-success/20 text-success' :
                  booking.status === 'pending' ? 'bg-warning/20 text-warning' :
                  'bg-info/20 text-info'
                }`}>
                  {booking.status}
                </span>
              </div>
            )) : (
              <p className="text-muted-foreground text-sm text-center py-4">No bookings yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioDashboard;
