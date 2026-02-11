import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Image, Calendar, Eye, Share2, ArrowLeft, Music, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface UserAlbum {
  id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  is_published: boolean;
  cover_image_url: string | null;
  client_name: string | null;
  image_count?: number;
  studio_name?: string;
}

const UserAlbums: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [albums, setAlbums] = useState<UserAlbum[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserAlbums();
  }, []);

  const fetchUserAlbums = async () => {
    try {
      const { data: albumsData, error } = await supabase
        .from('program_albums')
        .select('id, name, description, event_date, is_published, cover_image_url, client_name, studios(name)')
        .eq('is_published', true)
        .order('event_date', { ascending: false });

      if (error) throw error;

      if (albumsData && albumsData.length > 0) {
        const albumIds = albumsData.map(a => a.id);
        const { data: imageCounts } = await supabase
          .from('program_images')
          .select('program_album_id')
          .in('program_album_id', albumIds);

        const countMap: Record<string, number> = {};
        imageCounts?.forEach(img => {
          countMap[img.program_album_id] = (countMap[img.program_album_id] || 0) + 1;
        });

        setAlbums(albumsData.map(a => ({
          ...a,
          image_count: countMap[a.id] || 0,
          studio_name: (a.studios as any)?.name || 'Studio',
        })));
      }
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = (album: UserAlbum) => {
    const shareUrl = `${window.location.origin}/digital-album/${album.id}`;
    if (navigator.share) {
      navigator.share({ title: album.name, url: shareUrl }).catch(() => {
        navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link Copied!', description: 'Share this link with your family & friends' });
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({ title: 'Link Copied!', description: 'Share this link with your family & friends' });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]" style={{ backgroundImage: 'radial-gradient(ellipse at top, #1a1a2e 0%, #0a0a0a 60%)' }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/60 backdrop-blur-xl border-b border-amber-500/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/user')} className="p-2 rounded-full hover:bg-white/5 text-white/60 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-white font-semibold text-lg">My Albums</h1>
            <p className="text-amber-200/50 text-xs">Your event photo collections</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden bg-white/5 animate-pulse">
                <div className="aspect-[4/3] bg-white/10" />
                <div className="p-4 space-y-2">
                  <div className="h-4 w-2/3 bg-white/10 rounded" />
                  <div className="h-3 w-1/2 bg-white/10 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : albums.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
              <Image className="text-amber-400" size={36} />
            </div>
            <h3 className="text-white font-semibold text-xl mb-2">No Albums Yet</h3>
            <p className="text-white/40 mb-8 max-w-sm mx-auto">
              Your event albums will appear here once they are ready
            </p>
            <Button
              onClick={() => navigate('/booking')}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-400 hover:to-amber-500"
            >
              Book a Session
            </Button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-amber-500/30 transition-all duration-300"
              >
                {/* Cover Image */}
                <div
                  className="aspect-[4/3] relative overflow-hidden cursor-pointer"
                  onClick={() => navigate(`/digital-album/${album.id}`)}
                >
                  {album.cover_image_url ? (
                    <img
                      src={album.cover_image_url}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-purple-500/10 flex items-center justify-center">
                      <Image className="text-amber-400/40" size={56} />
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  {/* Badge */}
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full bg-green-500/20 backdrop-blur-sm text-green-400 text-[11px] font-medium flex items-center gap-1">
                      <Eye size={11} /> Live
                    </span>
                  </div>

                  {/* Bottom info on image */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-white font-semibold text-base truncate">{album.name}</h3>
                    {album.client_name && (
                      <p className="text-amber-200/70 text-xs mt-0.5 flex items-center gap-1">
                        <Users size={11} /> {album.client_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3.5">
                  <div className="flex items-center gap-3 text-xs text-white/40 mb-3">
                    {album.event_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(album.event_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Image size={12} />
                      {album.image_count} photos
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold text-xs h-9 hover:from-amber-400 hover:to-amber-500"
                      onClick={() => navigate(`/digital-album/${album.id}`)}
                    >
                      <Eye size={14} className="mr-1.5" />
                      View Album
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 text-white/60 hover:text-white hover:bg-white/5 h-9"
                      onClick={() => handleShare(album)}
                    >
                      <Share2 size={14} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserAlbums;
