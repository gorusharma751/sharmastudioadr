import React from 'react';
import { motion } from 'framer-motion';
import { Image, Lock, Share2, Heart, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Image,
      title: 'My Event Albums',
      description: 'Access your private event photos and albums',
      href: '/user/albums',
      color: 'text-blue-500',
    },
    {
      icon: Share2,
      title: 'Share with Family',
      description: 'Share your event link with family members',
      href: '/user/share',
      color: 'text-green-500',
    },
    {
      icon: Heart,
      title: 'Wedding Invitations',
      description: 'View and share your 3D wedding cards',
      href: '/user/invitations',
      color: 'text-pink-500',
    },
    {
      icon: Calendar,
      title: 'My Bookings',
      description: 'Track your booking status and details',
      href: '/user/bookings',
      color: 'text-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName="StudioSaaS" showAuth={false} />
      
      <div className="pt-24 pb-20">
        <div className="section-container">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-gold flex items-center justify-center">
              <span className="text-3xl font-bold text-primary-foreground">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Welcome Back!
            </h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link to={feature.href}>
                  <div className="admin-card group cursor-pointer h-full">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl bg-secondary ${feature.color}`}>
                        <feature.icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                      <ArrowRight className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Quick Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm text-muted-foreground">
              <Lock size={14} />
              Your data is private and secure
            </div>
          </motion.div>
        </div>
      </div>

      <Footer studioName="StudioSaaS" />
    </div>
  );
};

export default UserDashboard;
