import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Phone, Upload, Search, CheckCircle, Sparkles } from 'lucide-react';
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

const searchSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
});

type SearchFormData = z.infer<typeof searchSchema>;

const FindPhotosPage: React.FC = () => {
  const { studio } = useStudio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
  });

  const handleSelfieChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelfiePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: SearchFormData) => {
    if (!studio?.id) {
      toast({
        title: 'Error',
        description: 'Studio information not available',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('photo_search_requests').insert({
        studio_id: studio.id,
        name: data.name,
        phone: data.phone,
        selfie_url: selfiePreview, // In production, this would be uploaded to storage first
        status: 'pending',
      });

      if (error) throw error;

      setIsSuccess(true);
      reset();
      setSelfiePreview(null);
    } catch (error) {
      console.error('Search request error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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
            subtitle="Looking for your photos from a recent event? Upload a selfie and we'll help you find them using our AI-powered photo recognition system."
          />

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-xl mx-auto text-center py-16"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', bounce: 0.5 }}
                  className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-500/20 flex items-center justify-center"
                >
                  <CheckCircle className="text-green-500" size={48} />
                </motion.div>
                <h2 className="font-display text-3xl font-bold mb-4">
                  Request Submitted!
                </h2>
                <p className="text-muted-foreground mb-8">
                  We're processing your request. You'll receive a message on your phone once we find your photos.
                </p>
                <GlowButton onClick={() => setIsSuccess(false)}>
                  Submit Another Request
                </GlowButton>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                <div className="glass-card p-8 md:p-12">
                  {/* How it works */}
                  <div className="mb-10">
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Sparkles className="text-primary" size={20} />
                      How it works
                    </h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {[
                        { step: 1, text: 'Enter your details' },
                        { step: 2, text: 'Upload a clear selfie' },
                        { step: 3, text: 'We\'ll find your photos' },
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
                        {errors.name && (
                          <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
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
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Selfie Upload */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Camera size={16} className="text-primary" />
                        Upload Your Selfie
                      </Label>
                      <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                        {selfiePreview ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative inline-block"
                          >
                            <img
                              src={selfiePreview}
                              alt="Selfie preview"
                              className="w-40 h-40 object-cover rounded-xl mx-auto"
                            />
                            <button
                              type="button"
                              onClick={() => setSelfiePreview(null)}
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
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              className="inline-flex flex-col items-center"
                            >
                              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                                <Upload className="text-primary" size={28} />
                              </div>
                              <span className="text-foreground font-medium">Click to upload</span>
                              <span className="text-sm text-muted-foreground mt-1">
                                or drag and drop
                              </span>
                            </motion.div>
                          </label>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        A clear front-facing photo works best for accurate matching
                      </p>
                    </div>

                    <motion.div
                      className="pt-4"
                      whileHover={{ scale: 1.02 }}
                    >
                      <GlowButton
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full"
                      >
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
      
      <Footer studioName={studio?.name || 'Studio'} />
    </div>
  );
};

export default FindPhotosPage;
