import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image, Share2, Heart, Calendar, ArrowRight, LogOut, Music } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [albumCount, setAlbumCount] = useState(0);

  useEffect(() => {
    supabase
      .from('program_albums')
      .select('id', { count: 'exact', head: true })
      .eq('is_published', true)
      .then(({ count }) => setAlbumCount(count || 0));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const features = [
    {
      icon: Image,
      title: 'My Event Albums',
      description: 'View your private event photos',
      href: '/user/albums',
      count: albumCount,
    },
    {
      icon: Share2,
      title: 'Share with Family',
      description: 'Share event links & QR codes',
      href: '/user/share',
    },
    {
      icon: Heart,
      title: 'Wedding Invitations',
      description: 'View & share 3D wedding cards',
      href: '/user/invitations',
    },
    {
      icon: Calendar,
      title: 'My Bookings',
      description: 'Track your booking status',
      href: '/user/bookings',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={{ backgroundImage: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 60%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-amber-500/10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Welcome back!</p>
              <p className="text-amber-200/40 text-xs truncate max-w-[200px]">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-white/5 text-white/40 hover:text-white transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <Link to={feature.href}>
                <div className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all duration-300">
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors shrink-0">
                    <feature.icon size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">
                        {feature.title}
                      </h3>
                      {feature.count !== undefined && feature.count > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                          {feature.count}
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs mt-0.5">{feature.description}</p>
                  </div>
                  <ArrowRight className="text-white/20 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" size={16} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Quick Access - Recent Albums Preview */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/60 text-sm font-medium">Quick Access</h2>
            <Link to="/user/albums" className="text-amber-400 text-xs hover:underline">View All</Link>
          </div>
          <div
            onClick={() => navigate('/user/albums')}
            className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-purple-500/5 border border-amber-500/10 cursor-pointer hover:border-amber-500/20 transition-all text-center"
          >
            <Image className="mx-auto text-amber-400/60 mb-3" size={32} />
            <p className="text-white font-medium text-sm">
              {albumCount > 0 ? `${albumCount} Albums Available` : 'No Albums Yet'}
            </p>
            <p className="text-white/30 text-xs mt-1">Tap to browse your event photos</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default UserDashboard;
