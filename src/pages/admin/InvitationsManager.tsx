import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Heart, Calendar, MapPin, Trash2, Eye, Pencil, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface WeddingInvitation {
  id: string;
  studio_id: string;
  bride_name: string;
  groom_name: string;
  event_date: string | null;
  venue: string | null;
  message: string | null;
  template_id: string | null;
  created_at: string;
}

const templates = [
  { id: 'royal', name: 'Royal Gold', preview: '🏰' },
  { id: 'floral', name: 'Floral Garden', preview: '🌸' },
  { id: 'modern', name: 'Modern Minimal', preview: '✨' },
  { id: 'traditional', name: 'Traditional Indian', preview: '🪔' },
  { id: 'elegant', name: 'Elegant Script', preview: '💝' },
];

const InvitationsManager: React.FC = () => {
  const { studio } = useAuth();
  const { toast } = useToast();
  const [invitations, setInvitations] = useState<WeddingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<WeddingInvitation | null>(null);
  const [formData, setFormData] = useState({
    bride_name: '',
    groom_name: '',
    event_date: '',
    venue: '',
    message: '',
    template_id: 'royal',
  });

  useEffect(() => {
    if (studio?.id) {
      fetchInvitations();
    }
  }, [studio?.id]);

  const fetchInvitations = async () => {
    if (!studio?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('wedding_invitations')
        .select('*')
        .eq('studio_id', studio.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({ title: 'Error', description: 'Failed to load invitations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (invitation?: WeddingInvitation) => {
    if (invitation) {
      setEditingInvitation(invitation);
      setFormData({
        bride_name: invitation.bride_name,
        groom_name: invitation.groom_name,
        event_date: invitation.event_date || '',
        venue: invitation.venue || '',
        message: invitation.message || '',
        template_id: invitation.template_id || 'royal',
      });
    } else {
      setEditingInvitation(null);
      setFormData({
        bride_name: '',
        groom_name: '',
        event_date: '',
        venue: '',
        message: '',
        template_id: 'royal',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!studio?.id || !formData.bride_name || !formData.groom_name) {
      toast({ title: 'Error', description: 'Names are required', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        studio_id: studio.id,
        bride_name: formData.bride_name,
        groom_name: formData.groom_name,
        event_date: formData.event_date || null,
        venue: formData.venue || null,
        message: formData.message || null,
        template_id: formData.template_id,
      };

      if (editingInvitation) {
        const { error } = await supabase
          .from('wedding_invitations')
          .update(payload)
          .eq('id', editingInvitation.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Invitation updated' });
      } else {
        const { error } = await supabase.from('wedding_invitations').insert(payload);
        if (error) throw error;
        toast({ title: 'Success', description: 'Invitation created' });
      }

      setIsDialogOpen(false);
      fetchInvitations();
    } catch (error) {
      console.error('Error saving invitation:', error);
      toast({ title: 'Error', description: 'Failed to save invitation', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invitation?')) return;

    try {
      const { error } = await supabase.from('wedding_invitations').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Invitation deleted' });
      fetchInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">3D Wedding Invitations</h1>
          <p className="text-muted-foreground">Create beautiful 3D animated wedding cards</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus size={18} className="mr-2" />
          New Invitation
        </Button>
      </div>

      {/* Template Preview */}
      <div className="admin-card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="text-primary" size={18} />
          Available Templates
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {templates.map(template => (
            <div key={template.id} className="text-center p-4 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div className="text-4xl mb-2">{template.preview}</div>
              <p className="text-sm font-medium">{template.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Invitations List */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {invitations.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-muted/50 rounded-xl">
            <Heart className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">No invitations created yet</p>
          </div>
        ) : (
          invitations.map((invitation, index) => {
            const template = templates.find(t => t.id === invitation.template_id);
            return (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="admin-card"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{template?.preview || '💒'}</div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openDialog(invitation)}>
                      <Pencil size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(invitation.id)}>
                      <Trash2 size={16} className="text-destructive" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-display text-lg font-semibold">
                  {invitation.bride_name} & {invitation.groom_name}
                </h3>
                {invitation.event_date && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-2">
                    <Calendar size={14} />
                    {new Date(invitation.event_date).toLocaleDateString()}
                  </p>
                )}
                {invitation.venue && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <MapPin size={14} />
                    {invitation.venue}
                  </p>
                )}
                <div className="mt-4 pt-4 border-t border-border">
                  <Button size="sm" variant="outline" className="w-full">
                    <Eye size={14} className="mr-2" />
                    Preview Card
                  </Button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingInvitation ? 'Edit Invitation' : 'Create Invitation'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bride's Name *</Label>
                <Input
                  value={formData.bride_name}
                  onChange={e => setFormData({ ...formData, bride_name: e.target.value })}
                  placeholder="Priya"
                />
              </div>
              <div className="space-y-2">
                <Label>Groom's Name *</Label>
                <Input
                  value={formData.groom_name}
                  onChange={e => setFormData({ ...formData, groom_name: e.target.value })}
                  placeholder="Rahul"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={formData.template_id} onValueChange={v => setFormData({ ...formData, template_id: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.preview} {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Event Date</Label>
              <Input
                type="date"
                value={formData.event_date}
                onChange={e => setFormData({ ...formData, event_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Venue</Label>
              <Input
                value={formData.venue}
                onChange={e => setFormData({ ...formData, venue: e.target.value })}
                placeholder="Grand Palace, Mumbai"
              />
            </div>
            <div className="space-y-2">
              <Label>Personal Message</Label>
              <Textarea
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Together with our families, we invite you to..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              <Heart size={16} className="mr-2" />
              Save Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvitationsManager;
