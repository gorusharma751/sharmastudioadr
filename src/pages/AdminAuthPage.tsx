import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const AdminAuthPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({ email: '', password: '' });

  const { signIn, user, isSuperAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !authLoading && isSuperAdmin) {
      navigate('/admin');
    }
  }, [user, authLoading, isSuperAdmin, navigate]);

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
      const { error } = await signIn(validatedData.email, validatedData.password);
      
      if (error) {
        toast({
          title: 'Login Failed',
          description: error.message.includes('Invalid login credentials')
            ? 'Invalid email or password.'
            : error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Welcome Back!', description: 'Super Admin logged in.' });
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
    <div className="min-h-screen flex items-center justify-center hero-gradient p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4">
            <Shield className="text-primary-foreground" size={32} />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">
            Admin Panel
          </h2>
          <p className="text-muted-foreground">
            Super Admin access only
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail size={16} className="text-primary" /> Email
            </Label>
            <Input
              id="email" name="email" type="email"
              value={formData.email} onChange={handleChange}
              placeholder="admin@example.com"
              className={errors.email ? 'border-destructive' : ''}
              required
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock size={16} className="text-primary" /> Password
            </Label>
            <div className="relative">
              <Input
                id="password" name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password} onChange={handleChange}
                placeholder="••••••••" className="pr-10" required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
          </div>

          <Button type="submit" size="lg" className="w-full btn-premium group" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In as Admin'}
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminAuthPage;
