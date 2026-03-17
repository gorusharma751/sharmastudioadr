import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ROUTES } from '@/lib/routes';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const StudioAuthPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: '', password: '' });

  const { signIn, user, isStudioAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading && isStudioAdmin) {
      navigate(ROUTES.DASHBOARD);
    }
  }, [user, authLoading, isStudioAdmin, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validatedData = authSchema.parse(formData);
      const { error, redirectTo } = await signIn(validatedData.email, validatedData.password);

      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message.includes('Invalid login credentials')
            ? 'Invalid email or password.'
            : error.message,
          variant: 'destructive',
        });
      } else if (redirectTo === '/dashboard') {
        toast({ title: 'Welcome Back!', description: 'Studio admin logged in.' });
        navigate(ROUTES.DASHBOARD);
      } else {
        // Super admin tried to log in via studio page — redirect to admin
        toast({ title: 'Redirecting...', description: 'Use the admin panel instead.' });
        navigate(ROUTES.ADMIN);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex hero-gradient">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 pattern-dots opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent" />
        <div className="relative z-10 flex flex-col justify-center p-16">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl bg-gradient-gold flex items-center justify-center">
                <Camera className="text-primary-foreground" size={24} />
              </div>
              <span className="font-display text-2xl font-bold text-foreground">Trivora StudioOS</span>
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Manage Your{' '}
              <span className="text-gradient-gold">Photography</span>{' '}
              Business
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              The all-in-one platform for photography studios.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute bottom-0 right-0 w-2/3"
          >
            <img src="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80"
              alt="Photography" className="w-full h-auto rounded-tl-3xl opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </motion.div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-bold text-foreground mb-2">Studio Login</h2>
            <p className="text-muted-foreground">Sign in to manage your studio</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail size={16} className="text-primary" /> Email
              </Label>
              <Input id="email" name="email" type="email" value={formData.email}
                onChange={handleChange} placeholder="studio@example.com"
                className={errors.email ? 'border-destructive' : ''} required />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock size={16} className="text-primary" /> Password
              </Label>
              <div className="relative">
                <Input id="password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password} onChange={handleChange}
                  placeholder="••••••••" className="pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" size="lg" className="w-full btn-premium group" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => toast({ title: 'Coming Soon', description: 'Forgot password feature is coming soon.' })}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StudioAuthPage;
