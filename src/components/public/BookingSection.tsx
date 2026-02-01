import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Phone, Mail, User, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { SectionContainer, SectionHeader } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/database';
import { z } from 'zod';

const bookingSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Please enter a valid phone number').max(15),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  event_type: z.string().min(1, 'Please select an event type'),
  location: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

const eventTypes = [
  'Wedding',
  'Engagement',
  'Pre-Wedding Shoot',
  'Birthday Party',
  'Corporate Event',
  'Product Photography',
  'Portrait Session',
  'Other',
];

interface BookingSectionProps {
  studioId?: string;
  services?: Service[];
}

const BookingSection: React.FC<BookingSectionProps> = ({ studioId, services }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    event_type: '',
    event_dates: '',
    location: '',
    services_required: [] as string[],
    notes: '',
  });

  const defaultServices = [
    'Complete Wedding Coverage',
    'Video Editing',
    'Drone Coverage',
    'Cinematic Video',
    'Candid Photography',
    'Traditional Photography',
  ];

  const availableServices = services?.length 
    ? services.filter(s => s.is_visible).map(s => s.title)
    : defaultServices;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services_required: prev.services_required.includes(service)
        ? prev.services_required.filter(s => s !== service)
        : [...prev.services_required, service],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = bookingSchema.parse(formData);

      if (!studioId) {
        toast({
          title: 'Error',
          description: 'Studio not found. Please try again.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('bookings').insert({
        studio_id: studioId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        event_type: formData.event_type,
        event_dates: formData.event_dates ? [formData.event_dates] : [],
        location: formData.location || null,
        services_required: formData.services_required,
        notes: formData.notes || null,
        status: 'pending',
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: 'Booking Submitted!',
        description: 'We will contact you shortly to confirm your booking.',
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        email: '',
        event_type: '',
        event_dates: '',
        location: '',
        services_required: [],
        notes: '',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to submit booking. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <section className="py-24 bg-charcoal">
        <SectionContainer>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-lg mx-auto text-center"
          >
            <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-success" size={40} />
            </div>
            <h2 className="font-display text-3xl font-semibold text-foreground mb-4">
              Thank You!
            </h2>
            <p className="text-muted-foreground mb-8">
              Your booking request has been submitted successfully. 
              We will get back to you within 24 hours.
            </p>
            <Button onClick={() => setSuccess(false)} className="btn-premium">
              Submit Another Booking
            </Button>
          </motion.div>
        </SectionContainer>
      </section>
    );
  }

  return (
    <section className="py-24 bg-charcoal">
      <SectionContainer>
        <SectionHeader
          title="Book Your Session"
          subtitle="Fill out the form below and we'll get back to you to discuss your requirements"
        />

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          onSubmit={handleSubmit}
          className="max-w-2xl mx-auto space-y-6"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User size={16} className="text-primary" />
                Full Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your name"
                className={errors.name ? 'border-destructive' : ''}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.name}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone size={16} className="text-primary" />
                Phone Number *
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                className={errors.phone ? 'border-destructive' : ''}
                required
              />
              {errors.phone && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.phone}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                Email Address
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.email}
                </p>
              )}
            </div>

            {/* Event Type */}
            <div className="space-y-2">
              <Label htmlFor="event_type" className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Event Type *
              </Label>
              <select
                id="event_type"
                name="event_type"
                value={formData.event_type}
                onChange={handleChange}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground"
                required
              >
                <option value="">Select event type</option>
                {eventTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              {errors.event_type && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.event_type}
                </p>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Event Date */}
            <div className="space-y-2">
              <Label htmlFor="event_dates" className="flex items-center gap-2">
                <Calendar size={16} className="text-primary" />
                Event Date
              </Label>
              <Input
                id="event_dates"
                name="event_dates"
                type="date"
                value={formData.event_dates}
                onChange={handleChange}
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location" className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                Event Location
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City or venue"
              />
            </div>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              Services Required
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableServices.map(service => (
                <label
                  key={service}
                  className="flex items-center gap-2 p-3 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={formData.services_required.includes(service)}
                    onCheckedChange={() => handleServiceToggle(service)}
                  />
                  <span className="text-sm text-foreground">{service}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText size={16} className="text-primary" />
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Tell us more about your requirements..."
              rows={4}
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full btn-premium"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Booking Request'}
          </Button>
        </motion.form>
      </SectionContainer>
    </section>
  );
};

export default BookingSection;
