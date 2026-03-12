import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, Clock, CheckCircle, RefreshCw, Play, ImageIcon, Trash2, Plus, Calendar, MapPin, Link2, Hash, Loader2, AlertTriangle, Wifi, Database, Image, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';

const PYTHON_API = 'https://sharmastudioadr.onrender.com';

interface Event {
  id: string;
  studio_id: string;
  name: string;
  venue: string | null;
  event_date: string | null;
  drive_folder_link: string | null;
  api_event_id: string;
  is_active: boolean;
  created_at: string;
}

interface PhotoSearchRequest {
  id: string;
  studio_id: string;
  name: string;
  phone: string;
  selfie_url: string | null;
  status: string;
  created_at: string;
}

interface ApiStatus {
  checking: boolean;
  health: { ok: boolean; error?: string } | null;
  db: { ok: boolean; error?: string; data?: unknown } | null;
  events: Record<string, { ok: boolean; total?: number; error?: string; data?: unknown }>;
  showDetails: boolean;
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning',
  processing: 'bg-info/20 text-info',
  completed: 'bg-success/20 text-success',
};

const FindPhotosManager: React.FC = () => {
  const { currentStudio } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [requests, setRequests] = useState<PhotoSearchRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  const [eventStatuses, setEventStatuses] = useState<Record<string, string>>({});
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    checking: false, health: null, db: null, events: {}, showDetails: false,
  });

  // New event form
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', venue: '', event_date: '', drive_folder_link: '', api_event_id: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (currentStudio?.id) {
      fetchEvents();
      fetchRequests();
    }
  }, [currentStudio?.id]);

  const fetchEvents = async () => {
    if (!currentStudio?.id) return;
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('studio_id', currentStudio.id)
      .order('created_at', { ascending: false });
    if (!error) setEvents((data as any[]) || []);
  };

  const fetchRequests = async () => {
    if (!currentStudio?.id) return;
    const { data, error } = await supabase
      .from('photo_search_requests')
      .select('*')
      .eq('studio_id', currentStudio.id)
      .order('created_at', { ascending: false });
    if (!error) setRequests(data || []);
    setLoading(false);
  };

  const checkApiStatus = async () => {
    setApiStatus(s => ({ ...s, checking: true, health: null, db: null, events: {} }));
    const event_ids = events.map(e => e.api_event_id);
    try {
      // Call Python API directly — no edge function proxy needed
      const [healthRes, dbRes] = await Promise.all([
        fetch(`${PYTHON_API}/health`, { signal: AbortSignal.timeout(12000) }).then(r => r.json()).catch(e => ({ error: String(e) })),
        fetch(`${PYTHON_API}/test-db`, { signal: AbortSignal.timeout(15000) }).then(r => r.json()).catch(e => ({ error: String(e) })),
      ]);

      const eventMap: ApiStatus['events'] = {};
      await Promise.all(event_ids.map(async (eid) => {
        const data = await fetch(`${PYTHON_API}/event-stats/${encodeURIComponent(eid)}`, { signal: AbortSignal.timeout(15000) })
          .then(r => r.json()).catch(e => ({ error: String(e) }));
        eventMap[eid] = {
          ok: !data.error,
          total: data.total_photos ?? data.count,
          error: data.error,
          data,
        };
      }));

      const healthOk = healthRes?.status === 'ok';
      const dbOk = dbRes?.status === 'connected';
      setApiStatus({
        checking: false,
        health: { ok: healthOk, error: healthRes?.error },
        db: {
          ok: dbOk,
          error: dbRes?.error ? String(dbRes.error).substring(0, 120) : undefined,
          data: dbRes,
        },
        events: eventMap,
        showDetails: true,
      });
    } catch (err: any) {
      setApiStatus(s => ({
        ...s,
        checking: false,
        health: { ok: false, error: err?.message },
        showDetails: true,
      }));
    }
  };

  const createEvent = async () => {
    if (!currentStudio?.id || !newEvent.name || !newEvent.api_event_id) {
      toast({ title: 'Error', description: 'Event name and API Event ID are required', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.from('events').insert({
        studio_id: currentStudio.id,
        name: newEvent.name,
        venue: newEvent.venue || null,
        event_date: newEvent.event_date || null,
        drive_folder_link: newEvent.drive_folder_link || null,
        api_event_id: newEvent.api_event_id,
      } as any);
      if (error) throw error;
      toast({ title: '✅ Event Created!', description: `"${newEvent.name}" added successfully` });
      setNewEvent({ name: '', venue: '', event_date: '', drive_folder_link: '', api_event_id: '' });
      setShowCreateDialog(false);
      fetchEvents();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to create event', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const processEventPhotos = async (event: Event) => {
    if (!event.drive_folder_link) {
      toast({ title: 'Error', description: 'Drive folder link not set for this event', variant: 'destructive' });
      return;
    }
    setProcessingEventId(event.id);
    setEventStatuses(s => ({ ...s, [event.id]: '⏳ Waking up AI server (may take ~30s)...' }));

    try {
      // Call the Python API directly — bypasses edge function timeout limits
      const response = await fetch(`${PYTHON_API}/process-drive-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder_link: event.drive_folder_link,
          event_id: event.api_event_id,
        }),
        signal: AbortSignal.timeout(300000), // 5-minute timeout for large folders
      });

      const result = await response.json();

      if (result?.success) {
        const msg = `✅ Done! ${result.processed} photos embedded, ${result.skipped} skipped.`;
        setEventStatuses(s => ({ ...s, [event.id]: msg }));
        toast({ title: '🎉 Done!', description: `${result.processed} photos processed for "${event.name}"` });
      } else {
        const errMsg = result?.error || `Server error (${response.status})`;
        setEventStatuses(s => ({ ...s, [event.id]: `❌ ${String(errMsg).substring(0, 150)}` }));
        toast({ title: 'Error', description: String(errMsg).substring(0, 200), variant: 'destructive' });
      }
    } catch (error: any) {
      const msg = error?.name === 'TimeoutError'
        ? 'Timed out. Server may still be waking up — wait 30 seconds and try again.'
        : (error?.message || 'Failed to reach Python API');
      setEventStatuses(s => ({ ...s, [event.id]: `❌ ${msg}` }));
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setProcessingEventId(null);
    }
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Deleted', description: 'Event removed' });
      fetchEvents();
    }
  };

  const deleteRequest = async (id: string) => {
    const { error } = await supabase.from('photo_search_requests').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Deleted', description: 'Request removed' });
      fetchRequests();
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('photo_search_requests').update({ status }).eq('id', id);
    if (!error) {
      toast({ title: 'Updated', description: `Status set to ${status}` });
      fetchRequests();
    }
  };

  const filteredRequests = requests.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.phone.includes(searchQuery)
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
          <p className="text-muted-foreground">Manage events, process photos & handle search requests</p>
        </div>
        <Button onClick={() => { fetchEvents(); fetchRequests(); }} variant="outline" size="sm">
          <RefreshCw size={16} className="mr-2" /> Refresh
        </Button>
      </div>

      {/* ── API Status Diagnostics Panel ───────────────────────────────── */}
      <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Wifi size={16} className="text-primary" /> API System Status
          </h2>
          <Button
            size="sm"
            variant="outline"
            onClick={checkApiStatus}
            disabled={apiStatus.checking || events.length === 0}
          >
            {apiStatus.checking
              ? <><Loader2 size={14} className="mr-1 animate-spin" /> Checking...</>
              : <><RefreshCw size={14} className="mr-1" /> Run Diagnostics</>}
          </Button>
        </div>

        {apiStatus.showDetails && (
          <div className="space-y-2">
            {/* Row: Python API health */}
            <div className="flex items-center gap-3 text-sm">
              <span className={`w-2 h-2 rounded-full ${apiStatus.health?.ok ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium w-32">Python API</span>
              <span className={apiStatus.health?.ok ? 'text-green-600' : 'text-red-600'}>
                {apiStatus.health?.ok ? 'Online ✓' : `Offline — ${apiStatus.health?.error ?? 'no response'}`}
              </span>
            </div>

            {/* Row: MongoDB */}
            <div className="flex items-start gap-3 text-sm">
              <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${apiStatus.db?.ok ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium w-32 shrink-0">MongoDB Atlas</span>
              <div>
                <span className={apiStatus.db?.ok ? 'text-green-600' : 'text-red-600'}>
                  {apiStatus.db?.ok ? 'Connected ✓' : 'Auth Failed ✗'}
                </span>
                {!apiStatus.db?.ok && apiStatus.db?.error && (
                  <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{apiStatus.db.error}</p>
                )}
              </div>
            </div>

            {/* Per-event embedding counts */}
            {Object.entries(apiStatus.events).map(([eid, ev]) => (
              <div key={eid} className="flex items-center gap-3 text-sm">
                <span className={`w-2 h-2 rounded-full ${ev.ok ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="font-medium w-32 truncate">Event: {eid}</span>
                <span className={ev.ok ? 'text-green-600' : 'text-yellow-600'}>
                  {ev.ok
                    ? (ev.total !== undefined ? `${ev.total} photos embedded ✓` : 'Data OK ✓')
                    : `Not embedded — ${ev.error ?? 'no data'}`}
                </span>
              </div>
            ))}

            {/* MongoDB fix banner */}
            {apiStatus.db && !apiStatus.db.ok && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
                <div className="flex items-center gap-2 text-red-600 font-semibold text-sm">
                  <AlertTriangle size={16} /> MongoDB Auth is Failing — Fix Required
                </div>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to <strong>render.com</strong> → your <strong>deepface-api</strong> service</li>
                  <li>Click <strong>Environment</strong> tab</li>
                  <li>Find or add <code className="bg-muted px-1 rounded">MONGODB_URI</code></li>
                  <li>Set it to your MongoDB Atlas connection string (found in Studio Settings)</li>
                  <li>Save — Render will auto-redeploy</li>
                  <li>Once redeployed, click <strong>Process Photos</strong> for each event</li>
                </ol>
                <a
                  href="https://dashboard.render.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary underline"
                >
                  Open Render.com Dashboard <ExternalLink size={10} />
                </a>
              </div>
            )}

            {/* All good banner */}
            {apiStatus.health?.ok && apiStatus.db?.ok && (
              <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-600 text-xs font-medium">
                ✅ Everything looks good! If face matching still fails, click Process Photos for the event first.
              </div>
            )}
          </div>
        )}

        {!apiStatus.showDetails && (
          <p className="text-xs text-muted-foreground">
            Click "Run Diagnostics" to check Python API health, MongoDB connection, and photo embedding status per event.
          </p>
        )}
      </div>

      {/* Events Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Calendar size={20} className="text-primary" /> Events
          </h2>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={16} className="mr-2" /> New Event</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Event Name *</Label>
                  <Input value={newEvent.name} onChange={e => setNewEvent(s => ({ ...s, name: e.target.value }))} placeholder="Sharma Wedding" />
                </div>
                <div className="space-y-2">
                  <Label>Venue</Label>
                  <Input value={newEvent.venue} onChange={e => setNewEvent(s => ({ ...s, venue: e.target.value }))} placeholder="Royal Palace" />
                </div>
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Input type="date" value={newEvent.event_date} onChange={e => setNewEvent(s => ({ ...s, event_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Google Drive Folder Link</Label>
                  <Input value={newEvent.drive_folder_link} onChange={e => setNewEvent(s => ({ ...s, drive_folder_link: e.target.value }))} placeholder="https://drive.google.com/drive/folders/..." />
                </div>
                <div className="space-y-2">
                  <Label>API Event ID * (unique identifier)</Label>
                  <Input value={newEvent.api_event_id} onChange={e => setNewEvent(s => ({ ...s, api_event_id: e.target.value }))} placeholder="sharma-wedding-2024" />
                </div>
                <Button onClick={createEvent} disabled={creating} className="w-full">
                  {creating ? <><Loader2 size={16} className="mr-2 animate-spin" /> Creating...</> : 'Create Event'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8 bg-muted/50 rounded-xl">
            <Calendar className="mx-auto text-muted-foreground mb-3" size={40} />
            <p className="text-muted-foreground">No events yet. Create your first event.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <motion.div key={event.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="admin-card border border-border">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{event.name}</h3>
                      <Badge variant={event.is_active ? 'default' : 'secondary'}>{event.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {event.venue && <span className="flex items-center gap-1"><MapPin size={14} />{event.venue}</span>}
                      {event.event_date && <span className="flex items-center gap-1"><Calendar size={14} />{new Date(event.event_date).toLocaleDateString()}</span>}
                      <span className="flex items-center gap-1"><Hash size={14} />{event.api_event_id}</span>
                      {event.drive_folder_link && <span className="flex items-center gap-1"><Link2 size={14} />Drive linked</span>}
                    </div>
                    {eventStatuses[event.id] && (
                      <p className="text-sm font-medium mt-2">{eventStatuses[event.id]}</p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => processEventPhotos(event)}
                      disabled={processingEventId === event.id || !event.drive_folder_link}
                    >
                      {processingEventId === event.id ? (
                        <><Loader2 size={14} className="mr-1 animate-spin" /> Processing...</>
                      ) : (
                        <><Play size={14} className="mr-1" /> Process Photos</>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive"><Trash2 size={14} /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                          <AlertDialogDescription>Delete "{event.name}"? This cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteEvent(event.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Search Requests Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Search size={20} className="text-primary" /> Search Requests
        </h2>

        <div className="grid grid-cols-3 gap-4">
          {['pending', 'processing', 'completed'].map(status => (
            <div key={status} className="admin-card text-center">
              <p className="text-2xl font-bold">{requests.filter(r => r.status === status).length}</p>
              <p className="text-sm text-muted-foreground capitalize">{status}</p>
            </div>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name or phone..." className="pl-10" />
        </div>

        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-xl">
              <Search className="mx-auto text-muted-foreground mb-3" size={40} />
              <p className="text-muted-foreground">{searchQuery ? 'No matching requests' : 'No requests yet'}</p>
            </div>
          ) : (
            filteredRequests.map((request, index) => (
              <motion.div key={request.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="admin-card">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold">{request.name}</h3>
                      <Badge className={statusColors[request.status] || ''}>{request.status}</Badge>
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
                        <Button size="sm" variant="destructive"><Trash2 size={14} /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Request?</AlertDialogTitle>
                          <AlertDialogDescription>Delete request from {request.name}?</AlertDialogDescription>
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
    </div>
  );
};

export default FindPhotosManager;
