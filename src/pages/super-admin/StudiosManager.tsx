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
    logoUrl: '', themeType: 'gradient' as 'solid' | 'gradient',
    primaryColor: '#D4AF37', secondaryColor: '#1a1a2e', gradientAngle: 45,
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
      // 1. Create the auth user for this studio
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newStudio.ownerEmail,
        password: newStudio.ownerPassword,
        options: { emailRedirectTo: window.location.origin }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      const ownerId = authData.user.id;

      // 2. Create the studio
      const { data: studioData, error: studioError } = await supabase
        .from('studios')
        .insert({
          name: newStudio.name,
          slug: newStudio.slug,
          owner_id: ownerId,
          is_active: true,
          is_public: true,
        })
        .select()
        .single();

      if (studioError) throw studioError;

      // 3. Assign studio_admin role
      await supabase.from('user_roles').insert({
        user_id: ownerId,
        role: 'studio_admin' as any,
      });

      // 4. Add as studio member
      await supabase.from('studio_members').insert({
        studio_id: studioData.id,
        user_id: ownerId,
        role: 'admin',
      });

      // 5. Create default studio settings with branding
      await supabase.from('studio_settings').insert({
        studio_id: studioData.id,
        contact_phone: newStudio.contactPhone || null,
        address: newStudio.location || null,
        logo_url: newStudio.logoUrl || null,
        theme_type: newStudio.themeType,
        primary_color: newStudio.primaryColor,
        secondary_color: newStudio.secondaryColor,
        gradient_angle: newStudio.gradientAngle,
      });

      toast({ title: 'Studio Created!', description: `${newStudio.name} is now active.` });
      setCreateOpen(false);
      setNewStudio({
        name: '', slug: '', ownerEmail: '', ownerPassword: '',
        contactPhone: '', location: '', logoUrl: '', themeType: 'gradient',
        primaryColor: '#D4AF37', secondaryColor: '#1a1a2e', gradientAngle: 45
      });
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
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Create New Studio</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* SECTION 1 - Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Basic Information</h3>
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

              {/* SECTION 2 - Branding */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Branding</h3>
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input value={newStudio.logoUrl}
                    onChange={e => setNewStudio(p => ({ ...p, logoUrl: e.target.value }))}
                    placeholder="https://example.com/logo.png" />
                  <p className="text-xs text-muted-foreground">Upload your logo to a hosting service and paste the URL here</p>
                </div>
                {newStudio.logoUrl && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <img src={newStudio.logoUrl} alt="Logo preview" className="h-12 w-12 object-contain rounded" />
                    <span className="text-sm text-muted-foreground">Logo preview</span>
                  </div>
                )}
              </div>

              {/* SECTION 3 - Theme */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Theme Configuration</h3>
                <div className="space-y-2">
                  <Label>Theme Type</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={newStudio.themeType === 'solid'}
                        onChange={() => setNewStudio(p => ({ ...p, themeType: 'solid' }))} />
                      <span className="text-sm">Solid Color</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={newStudio.themeType === 'gradient'}
                        onChange={() => setNewStudio(p => ({ ...p, themeType: 'gradient' }))} />
                      <span className="text-sm">Gradient</span>
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={newStudio.primaryColor}
                        onChange={e => setNewStudio(p => ({ ...p, primaryColor: e.target.value }))}
                        className="w-20 h-10 p-1 cursor-pointer" />
                      <Input value={newStudio.primaryColor}
                        onChange={e => setNewStudio(p => ({ ...p, primaryColor: e.target.value }))}
                        placeholder="#D4AF37" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" value={newStudio.secondaryColor}
                        onChange={e => setNewStudio(p => ({ ...p, secondaryColor: e.target.value }))}
                        className="w-20 h-10 p-1 cursor-pointer" />
                      <Input value={newStudio.secondaryColor}
                        onChange={e => setNewStudio(p => ({ ...p, secondaryColor: e.target.value }))}
                        placeholder="#1a1a2e" />
                    </div>
                  </div>
                </div>
                {newStudio.themeType === 'gradient' && (
                  <div className="space-y-2">
                    <Label>Gradient Angle: {newStudio.gradientAngle}°</Label>
                    <input type="range" min="0" max="360" value={newStudio.gradientAngle}
                      onChange={e => setNewStudio(p => ({ ...p, gradientAngle: parseInt(e.target.value) }))}
                      className="w-full" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div
                    className="h-24 rounded-lg border flex items-center justify-center text-white font-semibold"
                    style={{
                      background: newStudio.themeType === 'gradient'
                        ? `linear-gradient(${newStudio.gradientAngle}deg, ${newStudio.primaryColor}, ${newStudio.secondaryColor})`
                        : newStudio.primaryColor
                    }}
                  >
                    {newStudio.name || 'Studio Theme Preview'}
                  </div>
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
                    <DropdownMenuItem onClick={() => window.open(`/@${studio.slug}`, '_blank')}>
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
