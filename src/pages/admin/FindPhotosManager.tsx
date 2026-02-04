import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, User, Clock, CheckCircle, XCircle, Link2, Eye, Webhook, FolderOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface PhotoSearchRequest {
  id: string;
  studio_id: string;
  name: string;
  phone: string;
  selfie_url: string | null;
  status: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-info/20 text-info',
  completed: 'bg-success/20 text-success',
};

const FindPhotosManager: React.FC = () => {
  const { currentStudio } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<PhotoSearchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PhotoSearchRequest | null>(null);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [driveFolder, setDriveFolder] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (currentStudio?.id) {
      fetchRequests();
      fetchSettings();
    }
  }, [currentStudio?.id]);

  const fetchSettings = async () => {
    if (!currentStudio?.id) return;
    
    try {
      const { data } = await supabase
        .from('studio_settings')
        .select('webhook_url, google_drive_folder')
        .eq('studio_id', currentStudio.id)
        .maybeSingle();

      if (data) {
        setWebhookUrl(data.webhook_url || '');
        setDriveFolder(data.google_drive_folder || '');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchRequests = async () => {
    if (!currentStudio?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('photo_search_requests')
        .select('*')
        .eq('studio_id', currentStudio.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({ title: 'Error', description: 'Failed to load requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('photo_search_requests')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: `Status updated to ${status}` });
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const saveSettings = async () => {
    if (!currentStudio?.id) return;

    try {
      const { data: existing } = await supabase
        .from('studio_settings')
        .select('id')
        .eq('studio_id', currentStudio.id)
        .maybeSingle();

      const payload = {
        studio_id: currentStudio.id,
        webhook_url: webhookUrl || null,
        google_drive_folder: driveFolder || null,
      };

      if (existing) {
        await supabase.from('studio_settings').update(payload).eq('id', existing.id);
      } else {
        await supabase.from('studio_settings').insert(payload);
      }

      toast({ title: 'Success', description: 'Settings saved' });
      setSettingsOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Find Your Photos</h1>
          <p className="text-muted-foreground">Manage photo search requests from customers</p>
        </div>
        <Button onClick={() => setSettingsOpen(true)} variant="outline">
          <Webhook size={18} className="mr-2" />
          Webhook Settings
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {['pending', 'processing', 'completed'].map(status => (
          <div key={status} className="admin-card text-center">
            <p className="text-2xl font-bold">{requests.filter(r => r.status === status).length}</p>
            <p className="text-sm text-muted-foreground capitalize">{status}</p>
          </div>
        ))}
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <Search className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">No photo search requests yet</p>
          </div>
        ) : (
          requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="admin-card"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {request.selfie_url && (
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={request.selfie_url} alt="Selfie" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold">{request.name}</h3>
                    <Badge className={statusColors[request.status] || ''}>
                      {request.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone size={14} />
                      {request.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(request.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus(request.id, 'processing')}>
                    <Clock size={14} className="mr-1" />
                    Processing
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(request.id, 'completed')}>
                    <CheckCircle size={14} className="mr-1" />
                    Complete
                  </Button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Webhook & Drive Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Webhook size={16} className="text-primary" />
                n8n Webhook URL
              </Label>
              <Input
                value={webhookUrl}
                onChange={e => setWebhookUrl(e.target.value)}
                placeholder="https://your-n8n-instance/webhook/..."
              />
              <p className="text-xs text-muted-foreground">
                Data will be sent to this webhook when new requests come in
              </p>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FolderOpen size={16} className="text-primary" />
                Google Drive Folder Link
              </Label>
              <Input
                value={driveFolder}
                onChange={e => setDriveFolder(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
              />
              <p className="text-xs text-muted-foreground">
                Link to the folder containing event photos
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={saveSettings}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FindPhotosManager;
