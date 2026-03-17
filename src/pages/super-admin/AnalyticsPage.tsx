import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Building2, Calendar, Users, Image } from 'lucide-react';
import { StatCard } from '@/components/ui/shared';
import { supabase } from '@/integrations/supabase/client';

const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState({ studios: 0, bookings: 0, albums: 0, events: 0 });

  useEffect(() => {
    const fetch = async () => {
      const [s, b, a, e] = await Promise.all([
        supabase.from('studios').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('program_albums').select('id', { count: 'exact', head: true }),
        supabase.from('events').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        studios: s.count || 0, bookings: b.count || 0,
        albums: a.count || 0, events: e.count || 0,
      });
    };
    fetch();
  }, []);

  const cards = [
    { label: 'Total Studios', value: String(stats.studios), icon: <Building2 size={24} /> },
    { label: 'Total Bookings', value: String(stats.bookings), icon: <Calendar size={24} /> },
    { label: 'Total Albums', value: String(stats.albums), icon: <Image size={24} /> },
    { label: 'Total Events', value: String(stats.events), icon: <BarChart3 size={24} /> },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Platform Analytics</h1>
        <p className="text-muted-foreground">Overview of platform-wide metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <StatCard value={stat.value} label={stat.label} icon={stat.icon} />
          </motion.div>
        ))}
      </div>

      <div className="admin-card text-center py-12">
        <BarChart3 className="mx-auto text-muted-foreground mb-3" size={48} />
        <p className="text-muted-foreground">Detailed charts coming soon</p>
      </div>
    </div>
  );
};

export default AnalyticsPage;
