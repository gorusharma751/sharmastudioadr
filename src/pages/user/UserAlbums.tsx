import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image, Lock, Calendar, Eye, Share2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';

interface UserAlbum {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  is_published: boolean;
  image_count?: number;
}

const UserAlbums: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [albums, setAlbums] = useState<UserAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAlbums();
  }, [user]);

  const fetchUserAlbums = async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      // Fetch all published program albums that the user can access
      const { data: albums, error } = await supabase
        .from('program_albums')
        .select('id, name, description, event_date, is_published, cover_image_url, client_name')
        .eq('is_published', true)
        .order('event_date', { ascending: false });

      if (error) throw error;

      if (albums && albums.length > 0) {
        // Get image counts
        const albumIds = albums.map(a => a.id);
        const { data: imageCounts } = await supabase
          .from('program_images')
          .select('program_album_id')
          .in('program_album_id', albumIds);

        const countMap: Record<string, number> = {};
        imageCounts?.forEach(img => {
          countMap[img.program_album_id] = (countMap[img.program_album_id] || 0) + 1;
        });

        setAlbums(albums.map(a => ({ ...a, image_count: countMap[a.id] || 0 })));
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (album: UserAlbum) => {
    const shareUrl = `${window.location.origin}/digital-album/${album.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: 'Link Copied!', description: 'Share this link with your family' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <GlassNavbar studioName="StudioSaaS" />
        <div className="pt-24 pb-20 section-container">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName="StudioSaaS" />
      
      <div className="pt-24 pb-20">
        <div className="section-container">
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
            className="mb-8"
          >
            <h1 className="font-display text-3xl font-bold mb-2">My Event Albums</h1>
            <p className="text-muted-foreground">Access your private event photos</p>
          </motion.div>

          {/* Albums Grid */}
          {albums.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-muted/50 rounded-xl"
            >
              <Lock className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="font-semibold text-lg mb-2">No Albums Yet</h3>
              <p className="text-muted-foreground mb-6">
                Your event albums will appear here once they are ready
              </p>
              <Button onClick={() => navigate('/booking')}>Book a Session</Button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album, index) => (
                <motion.div
                  key={album.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="admin-card group overflow-hidden"
                >
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                    <Image className="text-primary/50" size={48} />
                    <div className="absolute top-3 right-3">
                      <span className="px-2 py-1 rounded-full bg-success/20 text-success text-xs flex items-center gap-1">
                        <Eye size={12} /> Available
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                    {album.name}
                  </h3>
                  
                  {album.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {album.description}
                    </p>
                  )}
                  
                  {album.event_date && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
                      <Calendar size={12} />
                      {new Date(album.event_date).toLocaleDateString()}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => navigate(`/digital-album/${album.id}`)}>
                      <Eye size={14} className="mr-2" />
                      View Album
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleShare(album)}>
                      <Share2 size={14} />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer studioName="StudioSaaS" />
    </div>
  );
};

export default UserAlbums;
