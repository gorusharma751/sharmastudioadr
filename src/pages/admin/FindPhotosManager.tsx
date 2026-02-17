import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, Clock, CheckCircle, RefreshCw, Play, ImageIcon, Square, Trash2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface PhotoSearchRequest {
  id: string;
  studio_id: string;
  name: string;
  phone: string;
  selfie_url: string | null;
  status: string;
  created_at: string;
}

interface ProcessingLog {
  photo: number;
  name: string;
  status: 'success' | 'skipped' | 'error';
  message: string;
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
  const [processingDrive, setProcessingDrive] = useState(false);
  const [driveProgress, setDriveProgress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [processLogs, setProcessLogs] = useState<ProcessingLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const cancelRef = useRef(false);

  useEffect(() => {
    if (currentStudio?.id) fetchRequests();
  }, [currentStudio?.id]);

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
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('photo_search_requests')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Request deleted successfully' });
      fetchRequests();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete request', variant: 'destructive' });
    }
  };

  const stopProcessing = () => {
    cancelRef.current = true;
    setDriveProgress('⏹ Stopping after current photo...');
  };

  const processDrivePhotos = async () => {
    if (!currentStudio?.id) return;
    cancelRef.current = false;
    setProcessingDrive(true);
    setDriveProgress('Starting Google Drive photo processing...');
    setProcessLogs([]);
    setShowLogs(true);
    setProgressPercent(0);

    let pageToken = "";
    let totalProcessed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    let batchCount = 0;

    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    try {
      while (true) {
        if (cancelRef.current) {
          setDriveProgress(`⏹ Stopped! ${totalProcessed} faces found, ${totalSkipped} skipped, ${totalFailed} failed across ${batchCount} photos.`);
          toast({ title: 'Processing Stopped', description: `Stopped after ${batchCount} photos.` });
          return;
        }

        batchCount++;
        setDriveProgress(`📸 Processing photo ${batchCount}...`);
        setProgressPercent(Math.min(95, batchCount * 2));

        let retries = 0;
        let data: any = null;

        while (retries < 3) {
          const res = await supabase.functions.invoke('process-drive-photos', {
            body: { studio_id: currentStudio.id, batch_size: 1, page_token: pageToken },
          });

          if (res.error) {
            retries++;
            if (retries >= 3) throw res.error;
            await delay(2000 * retries);
            continue;
          }

          data = res.data;
          break;
        }

        if (!data?.success) {
          const errMsg = data?.error || 'Unknown error';
          setDriveProgress(`❌ Error: ${errMsg}`);
          setProcessLogs(prev => [...prev, { photo: batchCount, name: '-', status: 'error', message: errMsg }]);
          toast({ title: 'Error', description: errMsg, variant: 'destructive' });
          return;
        }

        const processed = data.batch_processed || 0;
        const failed = data.failed || 0;

        totalProcessed += processed;
        totalFailed += failed;

        if (processed > 0) {
          setProcessLogs(prev => [...prev, { photo: batchCount, name: `Photo #${batchCount}`, status: 'success', message: 'Face detected & stored' }]);
        } else if (failed > 0) {
          const errDetail = data.errors?.[0] || 'Processing failed';
          setProcessLogs(prev => [...prev, { photo: batchCount, name: `Photo #${batchCount}`, status: 'error', message: errDetail }]);
        } else {
          totalSkipped++;
          setProcessLogs(prev => [...prev, { photo: batchCount, name: `Photo #${batchCount}`, status: 'skipped', message: 'No face detected' }]);
        }

        setDriveProgress(`Photo ${batchCount} done — ${totalProcessed} faces, ${totalSkipped} skipped, ${totalFailed} failed`);

        if (!data.has_more) break;
        pageToken = data.next_page_token;

        await delay(1500);
      }

      setProgressPercent(100);
      setDriveProgress(`✅ Done! ${totalProcessed} faces found, ${totalSkipped} skipped, ${totalFailed} failed across ${batchCount} photos.`);
      toast({
        title: '🎉 Processing Complete!',
        description: `${totalProcessed} faces found from ${batchCount} photos.`,
      });
    } catch (error: any) {
      console.error('Drive processing error:', error);
      setDriveProgress(`❌ Failed at photo ${batchCount}: ${error?.message || 'Could not process'}`);
      toast({ title: 'Error', description: 'Failed to process Drive photos', variant: 'destructive' });
    } finally {
      setProcessingDrive(false);
      cancelRef.current = false;
    }
  };

  const filteredRequests = requests.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">AI Find Photos</h1>
          <p className="text-muted-foreground">Manage face recognition requests & process event photos</p>
        </div>
        <Button onClick={fetchRequests} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" />
          Refresh
        </Button>
      </div>

      {/* Drive Processing Section */}
      <div className="admin-card border-2 border-primary/20">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ImageIcon size={20} className="text-primary" />
              Process Event Photos from Google Drive
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Fetch all photos from your configured Google Drive folder, generate face embeddings, and store them for matching.
            </p>
            {driveProgress && (
              <p className="text-sm mt-2 font-medium">{driveProgress}</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {processingDrive ? (
              <Button onClick={stopProcessing} variant="destructive">
                <Square size={16} className="mr-2" />
                Stop
              </Button>
            ) : (
              <Button onClick={processDrivePhotos}>
                <Play size={16} className="mr-2" />
                Process Photos
              </Button>
            )}
          </div>
        </div>
        {processingDrive && <Progress value={progressPercent} className="mt-4" />}

        {/* Processing Logs */}
        {processLogs.length > 0 && (
          <div className="mt-4">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {showLogs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              Processing Details ({processLogs.length} photos)
              <span className="text-xs">
                — ✅ {processLogs.filter(l => l.status === 'success').length}
                {' '}⏭ {processLogs.filter(l => l.status === 'skipped').length}
                {' '}❌ {processLogs.filter(l => l.status === 'error').length}
              </span>
            </button>
            {showLogs && (
              <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg divide-y divide-border">
                {processLogs.map((log, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="text-muted-foreground w-8 text-right">#{log.photo}</span>
                    {log.status === 'success' && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                    {log.status === 'skipped' && <AlertCircle size={14} className="text-yellow-500 shrink-0" />}
                    {log.status === 'error' && <AlertCircle size={14} className="text-destructive shrink-0" />}
                    <span className="truncate flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search by name or phone number..."
          className="pl-10"
        />
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <Search className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">
              {searchQuery ? 'No matching requests found' : 'No photo search requests yet'}
            </p>
          </div>
        ) : (
          filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="admin-card"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {request.selfie_url && !request.selfie_url.endsWith('...') && (
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
                    <span className="flex items-center gap-1"><Phone size={14} />{request.phone}</span>
                    <span className="flex items-center gap-1"><Clock size={14} />{new Date(request.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => updateStatus(request.id, 'processing')}>
                    <Clock size={14} className="mr-1" /> Processing
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(request.id, 'completed')}>
                    <CheckCircle size={14} className="mr-1" /> Complete
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="sm" variant="destructive">
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Request?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the request from <strong>{request.name}</strong>. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteRequest(request.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default FindPhotosManager;
