import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Phone, Mail, MapPin, FileText, CheckCircle, Sparkles } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { SectionContainer, SectionHeader, GlowButton } from '@/components/ui/shared';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useStudio } from '@/contexts/StudioContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  event_type: z.string().min(1, 'Please select an event type'),
  event_dates: z.string().min(1, 'Please enter event date(s)'),
  location: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

const eventTypes = [
  'Wedding',
  'Pre-Wedding Shoot',
  'Engagement',
  'Birthday Party',
  'Corporate Event',
  'Product Shoot',
  'Portrait Session',
  'Other',
];

const serviceOptions = [
  'Traditional Photography',
  'Candid Photography',
  'Cinematic Video',
  'Traditional Video',
  'Drone Coverage',
  'Photo Editing',
  'Video Editing',
  'Album Design',
];

const BookingPage: React.FC = () => {
  const { studio, settings, services } = useStudio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
  });

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const onSubmit = async (data: BookingFormData) => {
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
      const { error } = await supabase.from('bookings').insert({
        studio_id: studio.id,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        event_type: data.event_type,
        event_dates: [data.event_dates],
        location: data.location || null,
        services_required: selectedServices,
        notes: data.notes || null,
        status: 'pending',
      });

      if (error) throw error;

      setIsSuccess(true);
      reset();
      setSelectedServices([]);
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} studioSlug={studio?.slug} studioId={studio?.id} />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="pt-32 pb-20"
      >
        <SectionContainer>
          <SectionHeader
            title="Book Your Session"
            subtitle="Fill out the form below and we'll get back to you within 24 hours to discuss your special day."
          />

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="max-w-2xl mx-auto text-center py-16"
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
                  Booking Submitted Successfully!
                </h2>
                <p className="text-muted-foreground mb-8">
                  Thank you for choosing us! We'll contact you shortly to confirm your booking details.
                </p>
                <GlowButton onClick={() => setIsSuccess(false)}>
                  Submit Another Booking
                </GlowButton>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit(onSubmit)}
                className="max-w-4xl mx-auto"
              >
                <div className="glass-card p-8 md:p-12">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User size={16} className="text-primary" />
                        Full Name *
                      </Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Your full name"
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

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail size={16} className="text-primary" />
                        Email (Optional)
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="your@email.com"
                        className="bg-background/50"
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event_type" className="flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" />
                        Event Type *
                      </Label>
                      <select
                        id="event_type"
                        {...register('event_type')}
                        className="w-full h-10 px-3 rounded-md border border-input bg-background/50 text-foreground"
                      >
                        <option value="">Select event type</option>
                        {eventTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      {errors.event_type && (
                        <p className="text-sm text-destructive">{errors.event_type.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="event_dates" className="flex items-center gap-2">
                        <Calendar size={16} className="text-primary" />
                        Event Date(s) *
                      </Label>
                      <Input
                        id="event_dates"
                        {...register('event_dates')}
                        placeholder="e.g., Dec 15-17, 2026"
                        className="bg-background/50"
                      />
                      {errors.event_dates && (
                        <p className="text-sm text-destructive">{errors.event_dates.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        Location
                      </Label>
                      <Input
                        id="location"
                        {...register('location')}
                        placeholder="Event venue / city"
                        className="bg-background/50"
                      />
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <Label className="flex items-center gap-2">
                      <FileText size={16} className="text-primary" />
                      Services Required
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {(services.length > 0 ? services.map(s => s.title) : serviceOptions).map(service => (
                        <motion.label
                          key={service}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`
                            flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
                            ${selectedServices.includes(service)
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-background/30 hover:border-primary/50'
                            }
                          `}
                        >
                          <Checkbox
                            checked={selectedServices.includes(service)}
                            onCheckedChange={() => toggleService(service)}
                          />
                          <span className="text-sm">{service}</span>
                        </motion.label>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 space-y-2">
                    <Label htmlFor="notes" className="flex items-center gap-2">
                      <FileText size={16} className="text-primary" />
                      Additional Notes
                    </Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Tell us more about your event, special requirements, or any questions..."
                      className="bg-background/50 min-h-[120px]"
                    />
                  </div>

                  <motion.div
                    className="mt-8 text-center"
                    whileHover={{ scale: 1.02 }}
                  >
                    <GlowButton
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full md:w-auto min-w-[250px]"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1 }}
                          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
                        />
                      ) : (
                        'Submit Booking Request'
                      )}
                    </GlowButton>
                  </motion.div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </SectionContainer>
      </motion.div>
      
      <Footer studioName={studio?.name || 'Studio'} logoUrl={settings?.logo_url || undefined} settings={settings} studioSlug={studio?.slug} />
    </div>
  );
};

export default BookingPage;
