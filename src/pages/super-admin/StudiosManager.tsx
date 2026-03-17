import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building2, Plus, MoreVertical, Search, Power, Trash2, Edit, Eye } from 'lucide-react';
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
import { Studio } from '@/types/database';

const StudiosManager: React.FC = () => {
  const [studios, setStudios] = useState<Studio[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  const [newStudio, setNewStudio] = useState({
    name: '', slug: '', ownerEmail: '', ownerPassword: '',
    contactPhone: '', location: '',
  });

  const fetchStudios = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('studios')
      .select('*, saas_plans(*)')
      .order('created_at', { ascending: false });
    if (data) setStudios(data as Studio[]);
    setLoading(false);
  };

  useEffect(() => { fetchStudios(); }, []);

  const handleCreate = async () => {
    if (!newStudio.name || !newStudio.slug || !newStudio.ownerEmail || !newStudio.ownerPassword) {
      toast({ title: 'Missing Fields', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-studio', {
        body: {
          name: newStudio.name,
          slug: newStudio.slug,
          ownerEmail: newStudio.ownerEmail,
          ownerPassword: newStudio.ownerPassword,
          contactPhone: newStudio.contactPhone,
          location: newStudio.location,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Studio Created!', description: `${newStudio.name} is now active.` });
      setCreateOpen(false);
      setNewStudio({ name: '', slug: '', ownerEmail: '', ownerPassword: '', contactPhone: '', location: '' });
      fetchStudios();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const toggleStudioActive = async (studio: Studio) => {
    await supabase.from('studios').update({ is_active: !studio.is_active }).eq('id', studio.id);
    toast({ title: studio.is_active ? 'Studio Suspended' : 'Studio Activated' });
    fetchStudios();
  };

  const deleteStudio = async (studio: Studio) => {
    if (!confirm(`Are you sure you want to delete "${studio.name}"? This cannot be undone.`)) return;
    await supabase.from('studios').delete().eq('id', studio.id);
    toast({ title: 'Studio Deleted' });
    fetchStudios();
  };

  const filtered = studios.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Studios</h1>
          <p className="text-muted-foreground">Create and manage photography studios</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="btn-premium">
              <Plus size={18} className="mr-2" /> Create Studio
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Create New Studio</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Studio Name *</Label>
                  <Input value={newStudio.name} onChange={e => setNewStudio(p => ({ ...p, name: e.target.value }))}
                    placeholder="Sharma Studio" />
                </div>
                <div className="space-y-2">
                  <Label>Studio Slug *</Label>
                  <Input value={newStudio.slug} onChange={e => setNewStudio(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') }))}
                    placeholder="sharma-studio" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Owner Email *</Label>
                  <Input type="email" value={newStudio.ownerEmail}
                    onChange={e => setNewStudio(p => ({ ...p, ownerEmail: e.target.value }))}
                    placeholder="admin@sharmastudio.com" />
                </div>
                <div className="space-y-2">
                  <Label>Owner Password *</Label>
                  <Input type="password" value={newStudio.ownerPassword}
                    onChange={e => setNewStudio(p => ({ ...p, ownerPassword: e.target.value }))}
                    placeholder="••••••••" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={newStudio.contactPhone}
                    onChange={e => setNewStudio(p => ({ ...p, contactPhone: e.target.value }))}
                    placeholder="+91 98765 43210" />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input value={newStudio.location}
                    onChange={e => setNewStudio(p => ({ ...p, location: e.target.value }))}
                    placeholder="Mumbai, India" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button className="btn-premium" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating...' : 'Create Studio'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search studios..." className="pl-10" />
      </div>

      {/* Studios List */}
      <div className="space-y-3">
        {loading ? (
          <p className="text-muted-foreground">Loading studios...</p>
        ) : filtered.length === 0 ? (
          <div className="admin-card text-center py-12">
            <Building2 className="mx-auto text-muted-foreground mb-3" size={48} />
            <p className="text-muted-foreground">No studios found</p>
          </div>
        ) : (
          filtered.map((studio, i) => (
            <motion.div
              key={studio.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="admin-card flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Building2 className="text-primary" size={22} />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{studio.name}</p>
                  <p className="text-sm text-muted-foreground">/{studio.slug}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                  studio.is_active
                    ? 'bg-success/20 text-success'
                    : 'bg-destructive/20 text-destructive'
                }`}>
                  {studio.is_active ? 'Active' : 'Suspended'}
                </span>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreVertical size={18} /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => window.open(`/${studio.slug}`, '_blank')}>
                      <Eye size={16} className="mr-2" /> View Website
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleStudioActive(studio)}>
                      <Power size={16} className="mr-2" />
                      {studio.is_active ? 'Suspend' : 'Activate'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => deleteStudio(studio)} className="text-destructive">
                      <Trash2 size={16} className="mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudiosManager;
