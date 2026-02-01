import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Image, Users, TrendingUp, Eye, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/shared';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

const StudioAdminDashboard: React.FC = () => {
  const { currentStudio } = useAuth();

  const stats = [
    { label: 'Total Bookings', value: '48', icon: <Calendar size={24} /> },
    { label: 'Portfolio Albums', value: '12', icon: <Image size={24} /> },
    { label: 'Website Visitors', value: '2.4K', icon: <Users size={24} /> },
    { label: 'This Month', value: '+23%', icon: <TrendingUp size={24} /> },
  ];

  const quickActions = [
    { label: 'View Website', icon: Eye, href: `/studio/${currentStudio?.slug}` },
    { label: 'Studio Settings', icon: Settings, href: '/admin/settings' },
    { label: 'Manage Bookings', icon: Calendar, href: '/admin/bookings' },
    { label: 'Add Portfolio', icon: Image, href: '/admin/portfolio' },
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
            {[
              { name: 'Amit & Sneha', event: 'Wedding', date: 'Feb 20, 2026', status: 'pending' },
              { name: 'Corporate Shoot', event: 'Event', date: 'Feb 18, 2026', status: 'confirmed' },
              { name: 'Birthday Session', event: 'Portrait', date: 'Feb 15, 2026', status: 'completed' },
            ].map((booking, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <p className="font-medium text-foreground">{booking.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.event} • {booking.date}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  booking.status === 'confirmed' ? 'bg-success/20 text-success' :
                  booking.status === 'pending' ? 'bg-warning/20 text-warning' :
                  'bg-info/20 text-info'
                }`}>
                  {booking.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudioAdminDashboard;
