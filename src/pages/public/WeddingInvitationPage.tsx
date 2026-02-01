import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Calendar, MapPin, MessageSquare, User, CheckCircle, Sparkles, Play } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer, SectionHeader, GlowButton } from '@/components/ui/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useStudio } from '@/contexts/StudioContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const invitationSchema = z.object({
  bride_name: z.string().min(2, 'Bride\'s name is required'),
  groom_name: z.string().min(2, 'Groom\'s name is required'),
  event_date: z.string().min(1, 'Event date is required'),
  venue: z.string().optional(),
  message: z.string().optional(),
});

type InvitationFormData = z.infer<typeof invitationSchema>;

const WeddingInvitationPage: React.FC = () => {
  const { studio } = useStudio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<InvitationFormData>({
    resolver: zodResolver(invitationSchema),
  });

  const brideName = watch('bride_name', '');
  const groomName = watch('groom_name', '');

  const onSubmit = async (data: InvitationFormData) => {
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
      const { error } = await supabase.from('wedding_invitations').insert({
        studio_id: studio.id,
        bride_name: data.bride_name,
        groom_name: data.groom_name,
        event_date: data.event_date,
        venue: data.venue || null,
        message: data.message || null,
      });

      if (error) throw error;

      setIsSuccess(true);
      reset();
    } catch (error) {
      console.error('Invitation request error:', error);
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
            title="3D Wedding Invitation"
            subtitle="Create a stunning 3D animated wedding invitation that will impress your guests and make your special day even more memorable."
          />

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Preview */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="order-2 lg:order-1"
            >
              <div className="glass-card p-8 h-full">
                <h3 className="font-display text-xl font-semibold mb-6 flex items-center gap-2">
                  <Sparkles className="text-primary" size={20} />
                  Preview
                </h3>
                
                {/* 3D Invitation Preview */}
                <div 
                  className="aspect-[9/16] max-h-[500px] rounded-2xl overflow-hidden relative"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--charcoal)) 0%, hsl(var(--background)) 50%, hsl(var(--charcoal)) 100%)',
                  }}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                    {/* Decorative elements */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5, delay: 0.3 }}
                      className="absolute top-8 left-8 w-16 h-16 border border-primary/30 rounded-full"
                    />
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5, delay: 0.4 }}
                      className="absolute bottom-8 right-8 w-24 h-24 border border-primary/20 rounded-full"
                    />
                    
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                      className="absolute top-20 right-12"
                    >
                      <Sparkles className="text-primary/30" size={24} />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Heart className="text-primary mx-auto mb-6" size={32} />
                    </motion.div>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-primary/70 text-sm uppercase tracking-wider mb-4"
                    >
                      Together with their families
                    </motion.p>

                    <motion.h2
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                      className="font-display text-3xl font-bold text-foreground mb-2"
                    >
                      {brideName || 'Bride Name'}
                    </motion.h2>

                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-primary text-xl"
                    >
                      &
                    </motion.span>

                    <motion.h2
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.9 }}
                      className="font-display text-3xl font-bold text-foreground mt-2 mb-8"
                    >
                      {groomName || 'Groom Name'}
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1 }}
                      className="text-muted-foreground text-sm"
                    >
                      Request the pleasure of your company
                    </motion.p>
                  </div>

                  {/* Play Button Overlay */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <div className="p-4 rounded-full bg-primary/90">
                      <Play className="text-primary-foreground" size={32} />
                    </div>
                  </motion.div>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Live preview updates as you type
                </p>
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="order-1 lg:order-2"
            >
              <AnimatePresence mode="wait">
                {isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="glass-card p-8 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                      className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                      <CheckCircle className="text-green-500" size={40} />
                    </motion.div>
                    <h2 className="font-display text-2xl font-bold mb-4">
                      Request Submitted!
                    </h2>
                    <p className="text-muted-foreground mb-6">
                      We'll create your beautiful 3D invitation and get in touch with you soon.
                    </p>
                    <GlowButton onClick={() => setIsSuccess(false)}>
                      Create Another
                    </GlowButton>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    onSubmit={handleSubmit(onSubmit)}
                    className="glass-card p-8"
                  >
                    <h3 className="font-display text-xl font-semibold mb-6">
                      Create Your Invitation
                    </h3>

                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="bride_name" className="flex items-center gap-2">
                            <User size={16} className="text-primary" />
                            Bride's Name *
                          </Label>
                          <Input
                            id="bride_name"
                            {...register('bride_name')}
                            placeholder="Enter bride's name"
                            className="bg-background/50"
                          />
                          {errors.bride_name && (
                            <p className="text-sm text-destructive">{errors.bride_name.message}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="groom_name" className="flex items-center gap-2">
                            <User size={16} className="text-primary" />
                            Groom's Name *
                          </Label>
                          <Input
                            id="groom_name"
                            {...register('groom_name')}
                            placeholder="Enter groom's name"
                            className="bg-background/50"
                          />
                          {errors.groom_name && (
                            <p className="text-sm text-destructive">{errors.groom_name.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="event_date" className="flex items-center gap-2">
                          <Calendar size={16} className="text-primary" />
                          Event Date *
                        </Label>
                        <Input
                          id="event_date"
                          type="date"
                          {...register('event_date')}
                          className="bg-background/50"
                        />
                        {errors.event_date && (
                          <p className="text-sm text-destructive">{errors.event_date.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="venue" className="flex items-center gap-2">
                          <MapPin size={16} className="text-primary" />
                          Venue
                        </Label>
                        <Input
                          id="venue"
                          {...register('venue')}
                          placeholder="Enter venue name and address"
                          className="bg-background/50"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-primary" />
                          Personal Message
                        </Label>
                        <Textarea
                          id="message"
                          {...register('message')}
                          placeholder="Add a personal message for your guests..."
                          className="bg-background/50 min-h-[100px]"
                        />
                      </div>

                      <motion.div whileHover={{ scale: 1.02 }}>
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
                              <Heart size={18} className="mr-2" />
                              Create Invitation
                            </>
                          )}
                        </GlowButton>
                      </motion.div>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </SectionContainer>
      </motion.div>
      
      <Footer studioName={studio?.name || 'Studio'} />
    </div>
  );
};

export default WeddingInvitationPage;
