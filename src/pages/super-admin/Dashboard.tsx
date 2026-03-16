import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Users, Calendar, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/ui/shared';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [studioCount, setStudioCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [recentStudios, setRecentStudios] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: sc }, { count: bc }, { data: rs }] = await Promise.all([
        supabase.from('studios').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('studios').select('name, slug, is_active, created_at').order('created_at', { ascending: false }).limit(5),
      ]);
      setStudioCount(sc || 0);
      setBookingCount(bc || 0);
      setRecentStudios(rs || []);
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Total Studios', value: String(studioCount), icon: <Building2 size={24} /> },
    { label: 'Total Bookings', value: String(bookingCount), icon: <Calendar size={24} /> },
    { label: 'Active Users', value: '—', icon: <Users size={24} /> },
    { label: 'Growth', value: '—', icon: <TrendingUp size={24} /> },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Platform Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Super Admin</p>
        </div>
        <Button className="btn-premium" onClick={() => navigate('/admin/studios')}>
          <Plus size={18} className="mr-2" /> Create Studio
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
            <StatCard value={stat.value} label={stat.label} icon={stat.icon} />
          </motion.div>
        ))}
      </div>

      <div className="admin-card">
        <h2 className="font-display text-xl font-semibold mb-4">Recent Studios</h2>
        <div className="space-y-3">
          {recentStudios.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Building2 size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{s.name}</p>
                  <p className="text-sm text-muted-foreground">/{s.slug}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${s.is_active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                {s.is_active ? 'Active' : 'Suspended'}
              </span>
            </div>
          ))}
          {recentStudios.length === 0 && (
            <p className="text-muted-foreground text-sm text-center py-4">No studios yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
