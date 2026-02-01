import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, Mail, MapPin, Clock, Send, Facebook, Instagram, Youtube } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

type ContactFormData = z.infer<typeof contactSchema>;

const ContactPage: React.FC = () => {
  const { studio, settings } = useStudio();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: 'Message Sent!',
      description: 'We\'ll get back to you as soon as possible.',
    });
    
    reset();
    setIsSubmitting(false);
  };

  const contactInfo = [
    {
      icon: Phone,
      label: 'Phone',
      value: settings?.contact_phone || '+91 98765 43210',
      href: `tel:${settings?.contact_phone || '+919876543210'}`,
    },
    {
      icon: Mail,
      label: 'Email',
      value: settings?.contact_email || 'hello@studio.com',
      href: `mailto:${settings?.contact_email || 'hello@studio.com'}`,
    },
    {
      icon: MapPin,
      label: 'Address',
      value: settings?.address || 'Mumbai, Maharashtra, India',
      href: '#',
    },
    {
      icon: Clock,
      label: 'Working Hours',
      value: 'Mon - Sat: 10:00 AM - 7:00 PM',
      href: '#',
    },
  ];

  const socialLinks = [
    { icon: Facebook, href: settings?.social_facebook || '#', label: 'Facebook' },
    { icon: Instagram, href: settings?.social_instagram || '#', label: 'Instagram' },
    { icon: Youtube, href: settings?.social_youtube || '#', label: 'YouTube' },
  ];

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
            title="Get in Touch"
            subtitle="Have questions or ready to book? We'd love to hear from you!"
          />

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="font-display text-2xl font-semibold mb-8">Contact Information</h3>
              
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <motion.a
                    key={info.label}
                    href={info.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    whileHover={{ x: 10 }}
                    className="flex items-start gap-4 p-4 glass-card group cursor-pointer"
                  >
                    <div className="p-3 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                      <info.icon className="text-primary" size={24} />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">{info.label}</div>
                      <div className="text-foreground font-medium">{info.value}</div>
                    </div>
                  </motion.a>
                ))}
              </div>

              <div className="mt-10">
                <h4 className="font-semibold mb-4">Follow Us</h4>
                <div className="flex gap-4">
                  {socialLinks.map((social, index) => (
                    <motion.a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.6 }}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-3 rounded-xl bg-primary/20 hover:bg-primary/30 transition-colors"
                    >
                      <social.icon className="text-primary" size={24} />
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Map Placeholder */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-10 aspect-video rounded-xl overflow-hidden bg-charcoal"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="mx-auto text-primary mb-2" size={32} />
                    <p className="text-muted-foreground">Map integration available</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="glass-card p-8 md:p-10">
                <h3 className="font-display text-2xl font-semibold mb-6">Send a Message</h3>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="John Doe"
                      className="bg-background/50"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="john@example.com"
                      className="bg-background/50"
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="+91 98765 43210"
                      className="bg-background/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      {...register('message')}
                      placeholder="Tell us about your project..."
                      className="bg-background/50 min-h-[150px]"
                    />
                    {errors.message && (
                      <p className="text-sm text-destructive">{errors.message.message}</p>
                    )}
                  </div>

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
                        <Send size={18} className="mr-2" />
                        Send Message
                      </>
                    )}
                  </GlowButton>
                </form>
              </div>
            </motion.div>
          </div>
        </SectionContainer>
      </motion.div>
      
      <Footer studioName={studio?.name || 'Studio'} />
    </div>
  );
};

export default ContactPage;
