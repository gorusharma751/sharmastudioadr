import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Plus, MoreVertical, Edit, Trash2, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface Plan {
  id: string;
  name: string;
  price: number;
  max_albums: number;
  max_photos: number;
  max_bookings: number;
  storage_limit_gb: number;
  is_active: boolean;
}

const PlansManager: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '', price: '0', max_albums: '50', max_photos: '1000',
    max_bookings: '100', storage_limit_gb: '10',
  });

  const fetchPlans = async () => {
    setLoading(true);
    const { data } = await supabase.from('saas_plans').select('*').order('price');
    if (data) setPlans(data as Plan[]);
    setLoading(false);
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    setSaving(true);
    const { error } = await supabase.from('saas_plans').insert({
      name: form.name, price: Number(form.price),
      max_albums: Number(form.max_albums), max_photos: Number(form.max_photos),
      max_bookings: Number(form.max_bookings), storage_limit_gb: Number(form.storage_limit_gb),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Plan Created!' });
      setCreateOpen(false);
      setForm({ name: '', price: '0', max_albums: '50', max_photos: '1000', max_bookings: '100', storage_limit_gb: '10' });
      fetchPlans();
    }
    setSaving(false);
  };

  const toggleActive = async (plan: Plan) => {
    await supabase.from('saas_plans').update({ is_active: !plan.is_active }).eq('id', plan.id);
    toast({ title: plan.is_active ? 'Plan Disabled' : 'Plan Enabled' });
    fetchPlans();
  };

  const deletePlan = async (plan: Plan) => {
    if (!confirm(`Delete "${plan.name}"?`)) return;
    await supabase.from('saas_plans').delete().eq('id', plan.id);
    toast({ title: 'Plan Deleted' });
    fetchPlans();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">SaaS Plans</h1>
          <p className="text-muted-foreground">Manage subscription plans for studios</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-premium"><Plus size={18} className="mr-2" /> Create Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display text-xl">New Plan</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Plan Name *</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Pro Plan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (₹/month)</Label>
                  <Input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Storage (GB)</Label>
                  <Input type="number" value={form.storage_limit_gb} onChange={e => setForm(p => ({ ...p, storage_limit_gb: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Albums</Label>
                  <Input type="number" value={form.max_albums} onChange={e => setForm(p => ({ ...p, max_albums: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Photos</Label>
                  <Input type="number" value={form.max_photos} onChange={e => setForm(p => ({ ...p, max_photos: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Max Bookings</Label>
                  <Input type="number" value={form.max_bookings} onChange={e => setForm(p => ({ ...p, max_bookings: e.target.value }))} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="btn-premium" onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-muted-foreground col-span-full">Loading plans...</p>
        ) : plans.length === 0 ? (
          <div className="admin-card text-center py-12 col-span-full">
            <CreditCard className="mx-auto text-muted-foreground mb-3" size={48} />
            <p className="text-muted-foreground">No plans created yet</p>
          </div>
        ) : (
          plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }} className="admin-card relative">
              <div className="absolute top-4 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => toggleActive(plan)}>
                      <Power size={16} className="mr-2" /> {plan.is_active ? 'Disable' : 'Enable'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deletePlan(plan)} className="text-destructive">
                      <Trash2 size={16} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mb-4">
                <span className={`px-2 py-1 text-xs rounded-full ${plan.is_active ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                  {plan.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="text-3xl font-bold text-primary mt-2">₹{plan.price}<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <p>{plan.max_albums} Albums • {plan.max_photos} Photos</p>
                <p>{plan.max_bookings} Bookings • {plan.storage_limit_gb}GB Storage</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default PlansManager;
