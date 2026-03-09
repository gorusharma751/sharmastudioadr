import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Phone, Upload, Search, CheckCircle, Sparkles, ImageIcon, Download, Calendar, MapPin, ChevronDown } from 'lucide-react';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer, SectionHeader, GlowButton } from '@/components/ui/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudio } from '@/contexts/StudioContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface EventItem {
  id: string;
  name: string;
  venue: string | null;
  event_date: string | null;
  api_event_id: string;
}

interface MatchedPhoto {
  url?: string;
  image_url?: string;
  filename?: string;
  similarity?: number;
}

const FindPhotosPage: React.FC = () => {
  const { studio } = useStudio();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [step, setStep] = useState<'event' | 'form' | 'processing' | 'results'>('event');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const [matchedPhotos, setMatchedPhotos] = useState<MatchedPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (studio?.id) fetchEvents();
  }, [studio?.id]);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('id, name, venue, event_date, api_event_id')
      .eq('is_active', true)
      .order('event_date', { ascending: false });
    setEvents((data as EventItem[]) || []);
  };

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelfieFile(file);
      setSelfiePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent || !selfieFile || !name.trim() || !phone.trim()) {
      toast({ title: 'Error', description: 'Please fill all fields and upload a selfie', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setStep('processing');

    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('mobile', phone.trim());
      formData.append('event_id', selectedEvent.api_event_id);
      formData.append('threshold', '0.55');
      formData.append('file', selfieFile, selfieFile.name);

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'hdyxyljiuoippdxxkngx';
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/match-face`,
        {
          method: 'POST',
          headers: {
            'apikey': anonKey,
          },
          body: formData,
        }
      );

      const result = await response.json();
      console.log('Match-face response:', result);

      const photos: MatchedPhoto[] = result?.matched_photos || result?.photos || [];
      // Normalize
      const normalized = photos.map((p: any) =>
        typeof p === 'string' ? { url: p } : p
      );

      setMatchedPhotos(normalized);
      setStep('results');

      if (normalized.length > 0) {
        toast({ title: '🎉 Photos Found!', description: `We found ${normalized.length} photos of you!` });
      } else {
        toast({ title: 'No matches', description: 'Try again with a clearer selfie.' });
      }
    } catch (error: any) {
      console.error('Match error:', error);
      toast({ title: 'Error', description: error?.message || 'Failed to process', variant: 'destructive' });
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPhotoUrl = (photo: MatchedPhoto): string => photo.url || photo.image_url || '';

  const handleReset = () => {
    setStep('event');
    setSelectedEvent(null);
    setMatchedPhotos([]);
    setSelfiePreview(null);
    setSelfieFile(null);
    setSelectedPhoto(null);
    setName('');
    setPhone('');
  };

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName={studio?.name || 'Studio'} />

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="pt-32 pb-20">
        <SectionContainer>
          <SectionHeader
            title="Find Your Photos"
            subtitle="Select your event, upload a selfie, and get your photos instantly using AI face recognition."
          />

          <AnimatePresence mode="wait">
            {/* Step 1: Select Event */}
            {step === 'event' && (
              <motion.div key="event" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
                <div className="glass-card p-8 md:p-12">
                  <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                    <Calendar className="text-primary" size={20} /> Select Your Event
                  </h3>
                  {events.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Search size={40} className="mx-auto mb-4 opacity-50" />
                      <p>No events available at the moment.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {events.map((event) => (
                        <motion.button
                          key={event.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setSelectedEvent(event); setStep('form'); }}
                          className="w-full text-left p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-foreground">{event.name}</h4>
                              <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                                {event.venue && <span className="flex items-center gap-1"><MapPin size={12} />{event.venue}</span>}
                                {event.event_date && <span className="flex items-center gap-1"><Calendar size={12} />{new Date(event.event_date).toLocaleDateString()}</span>}
                              </div>
                            </div>
                            <ChevronDown size={20} className="text-muted-foreground -rotate-90" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 2: Form */}
            {step === 'form' && (
              <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-2xl mx-auto">
                <div className="glass-card p-8 md:p-12">
                  <div className="mb-6 p-3 rounded-lg bg-primary/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Selected Event</p>
                      <p className="font-semibold">{selectedEvent?.name} {selectedEvent?.venue && `• ${selectedEvent.venue}`}</p>
                    </div>
                    <button onClick={handleReset} className="text-sm text-primary underline">Change</button>
                  </div>

                  <div className="mb-8">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="text-primary" size={20} /> How it works
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { step: 1, text: 'Enter your details' },
                        { step: 2, text: 'Upload a clear selfie' },
                        { step: 3, text: 'Get your photos instantly' },
                      ].map(item => (
                        <div key={item.step} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">{item.step}</div>
                          <span className="text-sm">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2"><User size={16} className="text-primary" /> Your Name *</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" className="bg-background/50" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2"><Phone size={16} className="text-primary" /> Phone Number *</Label>
                        <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="bg-background/50" required />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2"><Camera size={16} className="text-primary" /> Upload Your Selfie *</Label>
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                        {selfiePreview ? (
                          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative inline-block">
                            <img src={selfiePreview} alt="Selfie preview" className="w-40 h-40 object-cover rounded-xl mx-auto" />
                            <button type="button" onClick={() => { setSelfiePreview(null); setSelfieFile(null); }} className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full text-xs">×</button>
                          </motion.div>
                        ) : (
                          <label className="cursor-pointer block">
                            <input type="file" accept="image/*" capture="user" onChange={handleSelfieChange} className="hidden" />
                            <motion.div whileHover={{ scale: 1.05 }} className="inline-flex flex-col items-center">
                              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-4"><Upload className="text-primary" size={28} /></div>
                              <span className="text-foreground font-medium">Click to upload or take selfie</span>
                              <span className="text-sm text-muted-foreground mt-1">A clear front-facing photo works best</span>
                            </motion.div>
                          </label>
                        )}
                      </div>
                    </div>

                    <motion.div className="pt-4" whileHover={{ scale: 1.02 }}>
                      <GlowButton type="submit" disabled={isSubmitting} className="w-full">
                        <Search size={18} className="mr-2" /> Find My Photos
                      </GlowButton>
                    </motion.div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Processing */}
            {step === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="max-w-xl mx-auto text-center py-16">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} className="w-20 h-20 mx-auto mb-8 rounded-full border-4 border-primary border-t-transparent" />
                <h2 className="font-display text-2xl font-bold mb-4">Matching Your Face...</h2>
                <p className="text-muted-foreground mb-6">This may take a moment, especially if the server is waking up.</p>
                <Progress value={65} className="max-w-xs mx-auto" />
              </motion.div>
            )}

            {/* Results */}
            {step === 'results' && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto">
                {matchedPhotos.length > 0 ? (
                  <>
                    <div className="text-center mb-8">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="text-green-500" size={40} />
                      </motion.div>
                      <h2 className="font-display text-3xl font-bold mb-2">🎉 We Found {matchedPhotos.length} Photos!</h2>
                      <p className="text-muted-foreground">Here are your matched photos from {selectedEvent?.name}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                      {matchedPhotos.map((photo, index) => {
                        const url = getPhotoUrl(photo);
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="relative group cursor-pointer rounded-xl overflow-hidden aspect-square"
                            onClick={() => setSelectedPhoto(url)}
                          >
                            <img src={url} alt={photo.filename || `Photo ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                            </div>
                            {photo.similarity && (
                              <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {Math.round(photo.similarity * 100)}% match
                              </div>
                            )}
                            <a
                              href={url}
                              download={photo.filename || `photo-${index + 1}.jpg`}
                              onClick={(e) => e.stopPropagation()}
                              className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white p-2 rounded-lg"
                            >
                              <Download size={16} />
                            </a>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="text-center">
                      <GlowButton onClick={handleReset}>Search Again</GlowButton>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                      <Search className="text-muted-foreground" size={40} />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-4">No Matches Found</h2>
                    <p className="text-muted-foreground mb-8">Try uploading a clearer front-facing selfie.</p>
                    <GlowButton onClick={handleReset}>Try Again</GlowButton>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </SectionContainer>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
            <motion.img initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }} src={selectedPhoto} alt="Full size" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={(e) => e.stopPropagation()} />
            <div className="absolute top-4 right-4 flex gap-2">
              <a href={selectedPhoto} download className="text-white bg-black/50 w-10 h-10 rounded-full flex items-center justify-center"><Download size={18} /></a>
              <button onClick={() => setSelectedPhoto(null)} className="text-white bg-black/50 w-10 h-10 rounded-full flex items-center justify-center text-2xl">×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer studioName={studio?.name || 'Studio'} />
    </div>
  );
};

export default FindPhotosPage;
