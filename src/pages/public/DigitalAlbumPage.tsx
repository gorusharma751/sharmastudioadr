import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Phone, MessageCircle, Volume2, VolumeX, Maximize, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getDirectImageUrl } from '@/lib/imageUtils';

interface AlbumImage {
  id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
}

const DigitalAlbumPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isMobile = useIsMobile();
  const [album, setAlbum] = useState<any>(null);
  const [images, setImages] = useState<AlbumImage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'next' | 'prev'>('next');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [studioSettings, setStudioSettings] = useState<any>(null);
  const [albumSettings, setAlbumSettings] = useState<any>(null);
  const [showLeadForm, setShowLeadForm] = useState(true);
  const [leadData, setLeadData] = useState({ name: '', phone: '', email: '' });
  const [submittingLead, setSubmittingLead] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) fetchAlbum();
  }, [id]);

  const fetchAlbum = async () => {
    try {
      const { data: albumData, error } = await supabase
        .from('program_albums')
        .select('*, studios(name, slug, id)')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setAlbum(albumData);

      if (albumData?.studio_id) {
        const [settingsRes, albumSettingsRes] = await Promise.all([
          supabase.from('studio_settings').select('*').eq('studio_id', albumData.studio_id).single(),
          supabase.from('album_settings').select('*').eq('studio_id', albumData.studio_id).maybeSingle(),
        ]);
        setStudioSettings(settingsRes.data);
        const as = albumSettingsRes.data;
        setAlbumSettings(as);
        if (as && !as.lead_form_enabled) setShowLeadForm(false);
      }

      const { data: imagesData } = await supabase
        .from('program_images')
        .select('*')
        .eq('program_album_id', id!)
        .order('sort_order');
      setImages((imagesData || []) as AlbumImage[]);
    } catch (error) {
      console.error('Error fetching album:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadData.name || !leadData.phone || !album) return;
    setSubmittingLead(true);
    try {
      await supabase.from('album_leads').insert({
        studio_id: album.studio_id,
        program_album_id: album.id,
        name: leadData.name,
        phone: leadData.phone,
        email: leadData.email || null,
      });
      setShowLeadForm(false);
      // Start music if available
      const musicUrl = album.music_url || albumSettings?.music_url;
      if (musicUrl && audioRef.current) {
        audioRef.current.src = musicUrl;
        audioRef.current.play().catch(() => {});
        setIsMusicPlaying(true);
      }
    } catch (error) {
      console.error('Error submitting lead:', error);
    } finally {
      setSubmittingLead(false);
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (isMusicPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setIsMusicPlaying(!isMusicPlaying);
  };

  const goToPage = useCallback((direction: 'next' | 'prev') => {
    if (isFlipping) return;
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    if (newPage < 0 || newPage >= images.length) return;
    setFlipDirection(direction);
    setIsFlipping(true);
    setTimeout(() => {
      setCurrentPage(newPage);
      setIsFlipping(false);
    }, 600);
  }, [currentPage, images.length, isFlipping]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') goToPage('next');
    if (e.key === 'ArrowLeft') goToPage('prev');
    if (e.key === 'Escape') setIsFullscreen(false);
  }, [goToPage]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goToPage('next');
      else goToPage('prev');
    }
  };

  const studioName = album?.studios?.name || 'Studio';
  const studioPhone = studioSettings?.contact_phone;
  const logoUrl = studioSettings?.logo_url;
  const musicUrl = album?.music_url || albumSettings?.music_url;
  const watermarkEnabled = albumSettings?.watermark_enabled ?? true;
  const watermarkPosition = albumSettings?.watermark_position || 'bottom-right';
  const footerText = albumSettings?.footer_text || `© ${studioName}`;
  const formHeading = albumSettings?.lead_form_heading || 'Enter your details to view the album';
  const formButtonText = albumSettings?.lead_form_button_text || 'View Album';
  const formFields: string[] = (albumSettings?.lead_form_fields as string[]) || ['name', 'phone'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-amber-200/60 text-sm">Loading album...</p>
        </div>
      </div>
    );
  }

  if (!album || images.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Album Not Found</h2>
          <p className="text-gray-400">This album doesn't exist or has no images.</p>
        </div>
      </div>
    );
  }

  // Lead Form Gate
  if (showLeadForm) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4"
        style={{ backgroundImage: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 70%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Studio Logo */}
          <div className="text-center mb-8">
            {logoUrl ? (
              <img src={logoUrl} alt={studioName} className="h-16 w-auto mx-auto mb-4" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-2xl mx-auto mb-4">
                {studioName.charAt(0)}
              </div>
            )}
            <h1 className="text-white text-xl font-bold">{studioName}</h1>
            <p className="text-amber-200/60 text-sm mt-1">{album.name}</p>
          </div>

          <form onSubmit={handleLeadSubmit}
            className="bg-white/5 backdrop-blur-xl border border-amber-500/20 rounded-2xl p-6 space-y-4">
            <h2 className="text-white text-center font-semibold text-lg">{formHeading}</h2>

            {formFields.includes('name') && (
              <div className="space-y-1">
                <Label className="text-amber-200/80 text-sm">Name *</Label>
                <Input
                  value={leadData.name}
                  onChange={e => setLeadData({ ...leadData, name: e.target.value })}
                  placeholder="Your Name"
                  required
                  className="bg-white/10 border-amber-500/20 text-white placeholder:text-white/30"
                />
              </div>
            )}
            {formFields.includes('phone') && (
              <div className="space-y-1">
                <Label className="text-amber-200/80 text-sm">Phone *</Label>
                <Input
                  value={leadData.phone}
                  onChange={e => setLeadData({ ...leadData, phone: e.target.value })}
                  placeholder="Your Phone Number"
                  required
                  className="bg-white/10 border-amber-500/20 text-white placeholder:text-white/30"
                />
              </div>
            )}
            {formFields.includes('email') && (
              <div className="space-y-1">
                <Label className="text-amber-200/80 text-sm">Email</Label>
                <Input
                  type="email"
                  value={leadData.email}
                  onChange={e => setLeadData({ ...leadData, email: e.target.value })}
                  placeholder="Your Email"
                  className="bg-white/10 border-amber-500/20 text-white placeholder:text-white/30"
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={submittingLead}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-400 hover:to-amber-500"
            >
              {submittingLead ? 'Please wait...' : formButtonText}
            </Button>
          </form>
        </motion.div>
      </div>
    );
  }

  // Watermark position classes
  const wpClasses: Record<string, string> = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-[#0a0a0a] flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      style={{ backgroundImage: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 70%)' }}
    >
      <audio ref={audioRef} loop />

      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-black/40 backdrop-blur-sm border-b border-amber-500/10">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img src={logoUrl} alt={studioName} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-sm">
              {studioName.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-white font-semibold text-sm">{studioName}</h1>
            <p className="text-amber-200/50 text-xs">{album.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {musicUrl && (
            <button onClick={toggleMusic} className="p-2 rounded-full bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
              {isMusicPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          )}
          {studioPhone && (
            <>
              <a href={`tel:${studioPhone}`} className="p-2 rounded-full bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors">
                <Phone size={16} />
              </a>
              <a href={`https://wa.me/${studioPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-full bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors">
                <MessageCircle size={16} />
              </a>
            </>
          )}
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-full bg-white/5 text-white/60 hover:bg-white/10 transition-colors">
            {isFullscreen ? <X size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </header>

      {/* Album Viewer */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden px-4 py-6"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {!isMobile && (
          <>
            <button onClick={() => goToPage('prev')} disabled={currentPage === 0}
              className="absolute left-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:bg-black/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-110">
              <ChevronLeft size={24} />
            </button>
            <button onClick={() => goToPage('next')} disabled={currentPage >= images.length - 1}
              className="absolute right-4 z-10 p-3 rounded-full bg-black/40 text-white/80 hover:bg-black/60 disabled:opacity-20 disabled:cursor-not-allowed transition-all hover:scale-110">
              <ChevronRight size={24} />
            </button>
          </>
        )}

        <div className="relative w-full max-w-3xl mx-auto" style={{ perspective: '1500px' }}>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/40 to-transparent rounded-b-lg blur-lg" />
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={isMobile ? { opacity: 0, x: flipDirection === 'next' ? 300 : -300 } : { rotateY: flipDirection === 'next' ? -90 : 90, opacity: 0.5 }}
              animate={isMobile ? { opacity: 1, x: 0 } : { rotateY: 0, opacity: 1 }}
              exit={isMobile ? { opacity: 0, x: flipDirection === 'next' ? -300 : 300 } : { rotateY: flipDirection === 'next' ? 90 : -90, opacity: 0.5 }}
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              style={{ transformStyle: 'preserve-3d', transformOrigin: flipDirection === 'next' ? 'left center' : 'right center' }}
              className="relative aspect-[3/4] md:aspect-[4/3] rounded-lg overflow-hidden shadow-2xl"
            >
              <img src={getDirectImageUrl(images[currentPage].image_url)} alt={images[currentPage].caption || `Page ${currentPage + 1}`}
                className="w-full h-full object-cover" loading="eager" />

              {/* Watermark */}
              {watermarkEnabled && logoUrl && (
                <div className={`absolute ${wpClasses[watermarkPosition] || wpClasses['bottom-right']} opacity-30 pointer-events-none`}>
                  <img src={logoUrl} alt="" className="h-10 w-auto" />
                </div>
              )}

              <div className="absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-black/20 to-transparent" />
              <div className="absolute inset-y-0 left-0 w-2 bg-gradient-to-r from-black/30 to-transparent" />

              {images[currentPage].caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <p className="text-white text-sm font-medium">{images[currentPage].caption}</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {isMobile && currentPage === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs flex items-center gap-2">
            <ChevronLeft size={14} /> Swipe to navigate <ChevronRight size={14} />
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="px-4 py-3 bg-black/40 backdrop-blur-sm border-t border-amber-500/10">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <p className="text-amber-200/40 text-xs">
            {album.event_date && new Date(album.event_date).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-center gap-1">
            {images.length <= 20 ? (
              images.map((_, i) => (
                <button key={i} onClick={() => { setFlipDirection(i > currentPage ? 'next' : 'prev'); setCurrentPage(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentPage ? 'bg-amber-400 w-4' : 'bg-white/20 hover:bg-white/40'}`} />
              ))
            ) : (
              <span className="text-amber-200/60 text-xs font-medium">{currentPage + 1} / {images.length}</span>
            )}
          </div>
          <p className="text-amber-200/40 text-xs">{footerText}</p>
        </div>
      </footer>
    </div>
  );
};

export default DigitalAlbumPage;
