import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Camera, Search, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/lib/routes';

const LoginSelectorPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
            <Camera className="text-primary-foreground" size={32} />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome to Trivora StudioOS
          </h1>
          <p className="text-muted-foreground">
            How would you like to continue?
          </p>
        </div>

        <div className="space-y-4">
          {/* Studio Owner */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(ROUTES.LOGIN_STUDIO)}
            className="w-full p-6 rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                <Camera className="text-primary" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  Continue as Studio Owner
                </h3>
                <p className="text-sm text-muted-foreground">
                  Manage your studio, portfolio, bookings, and events
                </p>
              </div>
              <ArrowRight className="text-muted-foreground group-hover:text-primary transition-colors" size={20} />
            </div>
          </motion.button>

          {/* Event Guest */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(ROUTES.FIND_PHOTOS)}
            className="w-full p-6 rounded-xl border border-border bg-card hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-500/20 transition-colors">
                <Search className="text-amber-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  Continue as Event Guest
                </h3>
                <p className="text-sm text-muted-foreground">
                  Find your photos from an event using AI face recognition
                </p>
              </div>
              <ArrowRight className="text-muted-foreground group-hover:text-amber-500 transition-colors" size={20} />
            </div>
          </motion.button>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Event guests do not need an account to find their photos.
        </p>
      </motion.div>
    </div>
  );
};

export default LoginSelectorPage;
