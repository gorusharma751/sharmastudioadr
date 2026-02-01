import React from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Calendar, TrendingUp, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/shared';

const SuperAdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Studios', value: '24', icon: <Building2 size={24} /> },
    { label: 'Active Users', value: '156', icon: <Users size={24} /> },
    { label: 'Bookings This Month', value: '342', icon: <Calendar size={24} /> },
    { label: 'Revenue', value: '₹4.2L', icon: <TrendingUp size={24} /> },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Super Admin</p>
        </div>
        <Button className="btn-premium">
          <Plus size={18} className="mr-2" />
          Create Studio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard
              value={stat.value}
              label={stat.label}
              icon={stat.icon}
            />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="admin-card">
          <h2 className="font-display text-xl font-semibold mb-4">Recent Studios</h2>
          <div className="space-y-3">
            {['Royal Photography', 'Dream Weddings', 'Capture Moments'].map((name, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Building2 size={18} className="text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{name}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <h2 className="font-display text-xl font-semibold mb-4">Recent Bookings</h2>
          <div className="space-y-3">
            {[
              { name: 'Rahul & Priya Wedding', studio: 'Royal Photography', date: 'Feb 15, 2026' },
              { name: 'Corporate Event', studio: 'Dream Weddings', date: 'Feb 12, 2026' },
              { name: 'Birthday Party', studio: 'Capture Moments', date: 'Feb 10, 2026' },
            ].map((booking, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                <div>
                  <p className="font-medium text-foreground">{booking.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.studio} • {booking.date}</p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-success/20 text-success">Confirmed</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
