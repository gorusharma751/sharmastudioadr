import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { SectionContainer, SectionHeader, GlowButton } from '@/components/ui/shared';
import GlassNavbar from '@/components/GlassNavbar';
import Footer from '@/components/Footer';
import { supabase } from '@/integrations/supabase/client';
import { ROUTES } from '@/lib/routes';
import { SaasPlan } from '@/types/database';

const fallbackPlans = [
  { name: 'Starter', price: 0, features: ['1 Studio Website', '5 Portfolio Albums', '100 Photo Uploads', 'Basic Booking Form', 'Email Support'] },
  { name: 'Professional', price: 49, features: ['Custom Domain', '50 Portfolio Albums', '5,000 Photo Uploads', 'AI Photo Finder', 'Priority Support', 'Lead Capture', 'Digital Albums'] },
  { name: 'Enterprise', price: 149, features: ['Everything in Pro', 'Unlimited Albums', 'Unlimited Photos', 'White-label Branding', 'Dedicated Support', 'Custom Integrations', 'Analytics Dashboard'] },
];

const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SaasPlan[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data } = await supabase
        .from('saas_plans')
        .select('*')
        .eq('is_active', true)
        .order('price');
      if (data && data.length > 0) {
        setPlans(data as SaasPlan[]);
      }
    };
    fetchPlans();
  }, []);

  const displayPlans = plans.length > 0
    ? plans.map(p => ({ name: p.name, price: p.price, features: p.features || [] }))
    : fallbackPlans;

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar studioName="Trivora StudioOS" showAuth={true} onAuthClick={() => navigate(ROUTES.LOGIN)} />

      <section className="pt-32 pb-12">
        <SectionContainer>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent <span className="text-gradient-gold">Pricing</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose the plan that fits your studio. Upgrade anytime as you grow.
            </p>
          </motion.div>
        </SectionContainer>
      </section>

      <SectionContainer>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {displayPlans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`glass-card p-8 flex flex-col ${
                index === 1 ? 'border-primary/50 ring-1 ring-primary/20 scale-105' : ''
              }`}
            >
              {index === 1 && (
                <div className="text-center mb-4">
                  <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-display font-bold text-foreground">
                  {plan.price === 0 ? 'Free' : `$${plan.price}`}
                </span>
                {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check size={16} className="text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              <GlowButton
                variant={index === 1 ? 'primary' : 'outline'}
                className="w-full"
                onClick={() => navigate(ROUTES.LOGIN)}
              >
                Get Started <ArrowRight className="ml-2" size={16} />
              </GlowButton>
            </motion.div>
          ))}
        </div>
      </SectionContainer>

      <Footer studioName="Trivora StudioOS" />
    </div>
  );
};

export default PricingPage;
