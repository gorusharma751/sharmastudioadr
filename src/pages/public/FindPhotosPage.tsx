import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Phone, Upload, Search, CheckCircle, Sparkles, ImageIcon, Download } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer, SectionHeader, GlowButton } from '@/components/ui/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStudio } from '@/contexts/StudioContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

const searchSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

type SearchFormData = z.infer<typeof searchSchema>;

const FindPhotosPage: React.FC = () => {
  const { studio } = useStudio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'processing' | 'results'>('form');
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [selfieBase64, setSelfieBase64] = useState<string | null>(null);
  const [matchedPhotos, setMatchedPhotos] = useState<string[]>([]);
  const [processingStatus, setProcessingStatus] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  });

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setSelfiePreview(result);
        // Extract base64 without the data:image/xxx;base64, prefix
        const base64 = result.split(',')[1];
        setSelfieBase64(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SearchFormData) => {
    if (!studio?.id) {
      toast({ title: 'Error', description: 'Studio information not available', variant: 'destructive' });
      return;
    }

    if (!selfieBase64) {
      toast({ title: 'Error', description: 'Please upload your selfie first', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    setStep('processing');
    setProcessingStatus('Generating face embedding...');

    try {
      const { data: result, error } = await supabase.functions.invoke('match-face', {
        body: {
          studio_id: studio.id,
          name: data.name,
          phone: data.phone,
          selfie_base64: selfieBase64,
        },
      });

      if (error) throw error;

      if (result?.matched_photos && result.matched_photos.length > 0) {
        setMatchedPhotos(result.matched_photos);
        setStep('results');
        toast({ title: '🎉 Photos Found!', description: `We found ${result.matched_photos.length} photos of you!` });
      } else {
        setMatchedPhotos([]);
        setStep('results');
        toast({ title: 'No matches', description: 'We could not find any matching photos. Please try again with a clearer selfie.' });
      }
    } catch (error: any) {
      console.error('Match error:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to process. Please try again.',
        variant: 'destructive',
      });
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('form');
    setMatchedPhotos([]);
    setSelfiePreview(null);
    setSelfieBase64(null);
    setSelectedPhoto(null);
    reset();
  };

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName={studio?.name || 'Studio'} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-32 pb-20"
      >
        <SectionContainer>
          <SectionHeader
            title="Find Your Photos"
            subtitle="Upload a selfie and we'll find your photos from the event using AI-powered face recognition."
          />

          <AnimatePresence mode="wait">
            {step === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-xl mx-auto text-center py-16"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="w-20 h-20 mx-auto mb-8 rounded-full border-4 border-primary border-t-transparent"
                />
                <h2 className="font-display text-2xl font-bold mb-4">Processing Your Photo...</h2>
                <p className="text-muted-foreground mb-6">{processingStatus}</p>
                <Progress value={65} className="max-w-xs mx-auto" />
              </motion.div>
            )}

            {step === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-5xl mx-auto"
              >
                {matchedPhotos.length > 0 ? (
                  <>
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', bounce: 0.5 }}
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                      >
                        <CheckCircle className="text-green-500" size={40} />
                      </motion.div>
                      <h2 className="font-display text-3xl font-bold mb-2">
                        🎉 We Found {matchedPhotos.length} Photos!
                      </h2>
                      <p className="text-muted-foreground">Here are your matched photos from the event</p>
                    </div>

                    {/* Photo Gallery */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                      {matchedPhotos.map((photoUrl, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="relative group cursor-pointer rounded-xl overflow-hidden aspect-square"
                          onClick={() => setSelectedPhoto(photoUrl)}
                        >
                          <img
                            src={photoUrl}
                            alt={`Matched photo ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="text-center">
                      <GlowButton onClick={handleReset}>
                        Search Again
                      </GlowButton>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                      <Search className="text-muted-foreground" size={40} />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-4">No Matches Found</h2>
                    <p className="text-muted-foreground mb-8">
                      We couldn't find your photos. Try uploading a clearer front-facing selfie.
                    </p>
                    <GlowButton onClick={handleReset}>
                      Try Again
                    </GlowButton>
                  </div>
                )}
              </motion.div>
            )}

            {step === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="glass-card p-8 md:p-12">
                  <div className="mb-10">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="text-primary" size={20} />
                      How it works
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { step: 1, text: 'Enter your details' },
                        { step: 2, text: 'Upload a clear selfie' },
                        { step: 3, text: 'Get your photos instantly' },
                      ].map(item => (
                        <motion.div
                          key={item.step}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: item.step * 0.1 }}
                          className="flex items-center gap-3 p-3 rounded-lg bg-primary/5"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            {item.step}
                          </div>
                          <span className="text-sm">{item.text}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="flex items-center gap-2">
                          <User size={16} className="text-primary" />
                          Your Name *
                        </Label>
                        <Input
                          id="name"
                          {...register('name')}
                          placeholder="Enter your full name"
                          className="bg-background/50"
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                          <Phone size={16} className="text-primary" />
                          Phone Number *
                        </Label>
                        <Input
                          id="phone"
                          {...register('phone')}
                          placeholder="+91 98765 43210"
                          className="bg-background/50"
                        />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
                      </div>
                    </div>

                    {/* Selfie Upload */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Camera size={16} className="text-primary" />
                        Upload Your Selfie *
                      </Label>
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                        {selfiePreview ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative inline-block"
                          >
                            <img src={selfiePreview} alt="Selfie preview" className="w-40 h-40 object-cover rounded-xl mx-auto" />
                            <button
                              type="button"
                              onClick={() => { setSelfiePreview(null); setSelfieBase64(null); }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full text-xs"
                            >
                              ×
                            </button>
                          </motion.div>
                        ) : (
                          <label className="cursor-pointer block">
                            <input
                              type="file"
                              accept="image/*"
                              capture="user"
                              onChange={handleSelfieChange}
                              className="hidden"
                            />
                            <motion.div whileHover={{ scale: 1.05 }} className="inline-flex flex-col items-center">
                              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                                <Upload className="text-primary" size={28} />
                              </div>
                              <span className="text-foreground font-medium">Click to upload or take selfie</span>
                              <span className="text-sm text-muted-foreground mt-1">A clear front-facing photo works best</span>
                            </motion.div>
                          </label>
                        )}
                      </div>
                    </div>

                    <motion.div className="pt-4" whileHover={{ scale: 1.02 }}>
                      <GlowButton type="submit" disabled={isSubmitting} className="w-full">
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <Search size={18} className="mr-2" />
                            Find My Photos
                          </>
                        )}
                      </GlowButton>
                    </motion.div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </SectionContainer>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={selectedPhoto}
              alt="Full size"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 text-white text-2xl bg-black/50 w-10 h-10 rounded-full flex items-center justify-center"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <Footer studioName={studio?.name || 'Studio'} />
    </div>
  );
};

export default FindPhotosPage;
