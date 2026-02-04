import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, QrCode, Link2, Users, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

const UserShare: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Generate shareable link (in production, this would be a unique user-specific link)
  const shareableLink = `${window.location.origin}/find-photos`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareableLink);
    setCopied(true);
    toast({ title: 'Link Copied!', description: 'Share this link with your family and friends' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Find Your Photos',
          text: 'Find your photos from our event!',
          url: shareableLink,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName="StudioSaaS" />
      
      <div className="pt-24 pb-20">
        <div className="section-container max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" onClick={() => navigate('/user')}>
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center">
              <Share2 className="text-success" size={32} />
            </div>
            <h1 className="font-display text-3xl font-bold mb-2">Share with Family</h1>
            <p className="text-muted-foreground">
              Let your family and friends find their photos from your event
            </p>
          </motion.div>

          {/* Share Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="admin-card mb-8"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Link2 className="text-primary" size={18} />
              Shareable Link
            </h3>
            
            <div className="flex gap-2">
              <Input
                value={shareableLink}
                readOnly
                className="bg-secondary/50"
              />
              <Button onClick={handleCopy}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-2">
              Anyone with this link can upload a selfie to find their photos
            </p>
          </motion.div>

          {/* Share Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 gap-4 mb-8"
          >
            <button
              onClick={handleShare}
              className="admin-card flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
            >
              <div className="p-3 rounded-xl bg-info/20">
                <Share2 className="text-info" size={24} />
              </div>
              <div>
                <h4 className="font-semibold">Share Link</h4>
                <p className="text-sm text-muted-foreground">Via WhatsApp, SMS, or other apps</p>
              </div>
            </button>

            <button
              onClick={handleCopy}
              className="admin-card flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
            >
              <div className="p-3 rounded-xl bg-primary/20">
                <QrCode className="text-primary" size={24} />
              </div>
              <div>
                <h4 className="font-semibold">QR Code</h4>
                <p className="text-sm text-muted-foreground">Show QR at your event</p>
              </div>
            </button>
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="admin-card"
          >
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Users className="text-primary" size={18} />
              How it works
            </h3>
            
            <div className="space-y-4">
              {[
                { step: 1, text: 'Share the link with your family and friends' },
                { step: 2, text: 'They upload a selfie on the page' },
                { step: 3, text: 'Our AI finds their photos from the event' },
                { step: 4, text: 'They receive their personalized photos!' },
              ].map(item => (
                <div key={item.step} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                    {item.step}
                  </div>
                  <p className="text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <Footer studioName="StudioSaaS" />
    </div>
  );
};

export default UserShare;
