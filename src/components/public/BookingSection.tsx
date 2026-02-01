import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Phone, Mail, User, FileText, CheckCircle, AlertCircle, CalendarDays, X } from 'lucide-react';
import { SectionContainer, SectionHeader } from '@/components/ui/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/database';
import { z } from 'zod';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    event_type: '',
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

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDates(prev => {
      const exists = prev.some(d => d.toDateString() === date.toDateString());
      if (exists) {
        return prev.filter(d => d.toDateString() !== date.toDateString());
      }
      return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
    });
  };

  const removeDate = (dateToRemove: Date) => {
    setSelectedDates(prev => prev.filter(d => d.toDateString() !== dateToRemove.toDateString()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Validate form data
      const validatedData = bookingSchema.parse(formData);

      if (selectedDates.length === 0) {
        setErrors({ event_dates: 'Please select at least one event date' });
        setLoading(false);
        return;
      }

      const targetStudioId = studioId || 'demo';

      const { error } = await supabase.from('bookings').insert({
        studio_id: targetStudioId,
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        event_type: formData.event_type,
        event_dates: selectedDates.map(d => format(d, 'yyyy-MM-dd')),
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
        location: '',
        services_required: [],
        notes: '',
      });
      setSelectedDates([]);
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
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={40} />
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
        <div className="text-center max-w-2xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
              <span className="text-gradient-gold">Book Your Session</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Fill out the form below and we'll get back to you to discuss your requirements
            </p>
          </motion.div>
        </div>

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
            {/* Event Dates - Multiple Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CalendarDays size={16} className="text-primary" />
                Event Date(s) *
              </Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !selectedDates.length && "text-muted-foreground",
                      errors.event_dates && "border-destructive"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {selectedDates.length > 0 
                      ? `${selectedDates.length} date(s) selected`
                      : "Select dates"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={undefined}
                    onSelect={handleDateSelect}
                    disabled={(date) => date < new Date()}
                    modifiers={{
                      selected: selectedDates,
                    }}
                    modifiersStyles={{
                      selected: { 
                        backgroundColor: 'hsl(var(--primary))', 
                        color: 'hsl(var(--primary-foreground))' 
                      }
                    }}
                    className="p-3 pointer-events-auto"
                  />
                  <div className="p-3 border-t text-xs text-muted-foreground">
                    Click dates to add/remove. Selected: {selectedDates.length}
                  </div>
                </PopoverContent>
              </Popover>
              
              {/* Selected dates display */}
              {selectedDates.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedDates.map((date, idx) => (
                    <span 
                      key={idx}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                    >
                      {format(date, 'MMM d, yyyy')}
                      <button 
                        type="button"
                        onClick={() => removeDate(date)}
                        className="hover:text-destructive"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {errors.event_dates && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle size={14} /> {errors.event_dates}
                </p>
              )}
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
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors",
                    formData.services_required.includes(service)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  )}
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
