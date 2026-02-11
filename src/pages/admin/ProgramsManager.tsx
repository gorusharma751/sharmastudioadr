import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, Image, Calendar, QrCode, Save, ExternalLink, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ProgramAlbum, ProgramImage } from '@/types/database';

const ProgramsManager: React.FC = () => {
  const { currentStudio } = useAuth();
  const { toast } = useToast();
  const [programs, setPrograms] = useState<ProgramAlbum[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<ProgramAlbum | null>(null);
  const [programImages, setProgramImages] = useState<ProgramImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProgramDialogOpen, setIsProgramDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ProgramAlbum | null>(null);
  const [programFormData, setProgramFormData] = useState({
    name: '',
    description: '',
    event_date: '',
    client_name: '',
    slug: '',
    cover_image_url: '',
    music_url: '',
    is_published: false,
  });
  const [imageFormData, setImageFormData] = useState({ image_url: '', caption: '' });
  const [bulkUrls, setBulkUrls] = useState('');

  useEffect(() => {
    if (currentStudio?.id) fetchPrograms();
  }, [currentStudio?.id]);

  const fetchPrograms = async () => {
    if (!currentStudio?.id) return;
    try {
      const { data, error } = await supabase
        .from('program_albums')
        .select('*')
        .eq('studio_id', currentStudio.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPrograms((data || []) as ProgramAlbum[]);
    } catch (error) {
      console.error('Error fetching programs:', error);
      toast({ title: 'Error', description: 'Failed to load programs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchProgramImages = async (programId: string) => {
    try {
      const { data, error } = await supabase
        .from('program_images')
        .select('*')
        .eq('program_album_id', programId)
        .order('sort_order');
      if (error) throw error;
      setProgramImages((data || []) as ProgramImage[]);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const openProgramDialog = (program?: ProgramAlbum) => {
    if (program) {
      setEditingProgram(program);
      setProgramFormData({
        name: program.name,
        description: program.description || '',
        event_date: program.event_date || '',
        client_name: program.client_name || '',
        slug: program.slug || '',
        cover_image_url: program.cover_image_url || '',
        music_url: program.music_url || '',
        is_published: program.is_published,
      });
    } else {
      setEditingProgram(null);
      setProgramFormData({
        name: '', description: '', event_date: '', client_name: '', slug: '',
        cover_image_url: '', music_url: '', is_published: false,
      });
    }
    setIsProgramDialogOpen(true);
  };

  const handleSaveProgram = async () => {
    if (!currentStudio?.id || !programFormData.name) {
      toast({ title: 'Error', description: 'Album name is required', variant: 'destructive' });
      return;
    }
    try {
      const payload = {
        studio_id: currentStudio.id,
        name: programFormData.name,
        description: programFormData.description || null,
        event_date: programFormData.event_date || null,
        client_name: programFormData.client_name || null,
        slug: programFormData.slug || generateSlug(programFormData.name),
        cover_image_url: programFormData.cover_image_url || null,
        music_url: programFormData.music_url || null,
        is_published: programFormData.is_published,
      };
      if (editingProgram) {
        const { error } = await supabase.from('program_albums').update(payload).eq('id', editingProgram.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Album updated' });
      } else {
        const { error } = await supabase.from('program_albums').insert(payload);
        if (error) throw error;
        toast({ title: 'Success', description: 'Album created' });
      }
      setIsProgramDialogOpen(false);
      fetchPrograms();
    } catch (error: any) {
      console.error('Error saving program:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save', variant: 'destructive' });
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm('Delete this album and all its images?')) return;
    try {
      await supabase.from('program_images').delete().eq('program_album_id', id);
      const { error } = await supabase.from('program_albums').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted' });
      if (selectedProgram?.id === id) { setSelectedProgram(null); setProgramImages([]); }
      fetchPrograms();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleAddImage = async () => {
    if (!selectedProgram || !currentStudio?.id || !imageFormData.image_url) return;
    try {
      const { error } = await supabase.from('program_images').insert({
        studio_id: currentStudio.id,
        program_album_id: selectedProgram.id,
        image_url: imageFormData.image_url,
        caption: imageFormData.caption || null,
        sort_order: programImages.length,
      });
      if (error) throw error;
      toast({ title: 'Image added' });
      setIsImageDialogOpen(false);
      setImageFormData({ image_url: '', caption: '' });
      fetchProgramImages(selectedProgram.id);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add image', variant: 'destructive' });
    }
  };

  const handleBulkAddImages = async () => {
    if (!selectedProgram || !currentStudio?.id || !bulkUrls.trim()) return;
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(Boolean);
    try {
      const inserts = urls.map((url, i) => ({
        studio_id: currentStudio.id,
        program_album_id: selectedProgram.id,
        image_url: url,
        sort_order: programImages.length + i,
      }));
      const { error } = await supabase.from('program_images').insert(inserts);
      if (error) throw error;
      toast({ title: `${urls.length} images added` });
      setBulkUrls('');
      setIsImageDialogOpen(false);
      fetchProgramImages(selectedProgram.id);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add images', variant: 'destructive' });
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Delete this image?')) return;
    try {
      const { error } = await supabase.from('program_images').delete().eq('id', id);
      if (error) throw error;
      if (selectedProgram) fetchProgramImages(selectedProgram.id);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const copyAlbumUrl = (program: ProgramAlbum) => {
    const url = `${window.location.origin}/digital-album/${program.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Link copied!' });
  };

  const getQrUrl = (program: ProgramAlbum) => {
    const albumUrl = encodeURIComponent(`${window.location.origin}/digital-album/${program.id}`);
    return `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${albumUrl}`;
  };

  const selectProgram = (program: ProgramAlbum) => {
    setSelectedProgram(program);
    fetchProgramImages(program.id);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Event Albums</h1>
          <p className="text-muted-foreground">Manage digital wedding/event albums</p>
        </div>
        <Button onClick={() => openProgramDialog()}>
          <Plus size={18} className="mr-2" /> New Album
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Albums List */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Albums</h2>
          {programs.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-xl">
              <Calendar className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">No albums yet</p>
            </div>
          ) : (
            programs.map((program, index) => (
              <motion.div
                key={program.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => selectProgram(program)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedProgram?.id === program.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                }`}
              >
                {program.cover_image_url && (
                  <img src={program.cover_image_url} alt="" className="w-full h-24 object-cover rounded-md mb-2" />
                )}
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium truncate">{program.name}</h3>
                  {program.is_published ? <Eye size={16} className="text-green-500 shrink-0" /> : <EyeOff size={16} className="text-muted-foreground shrink-0" />}
                </div>
                {program.client_name && <p className="text-xs text-muted-foreground">Client: {program.client_name}</p>}
                {program.event_date && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar size={12} /> {new Date(program.event_date).toLocaleDateString()}
                  </p>
                )}
                <div className="flex gap-1 mt-3">
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); openProgramDialog(program); }}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); handleDeleteProgram(program.id); }}><Trash2 size={14} className="text-destructive" /></Button>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); setSelectedProgram(program); setIsQrDialogOpen(true); }}><QrCode size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={e => { e.stopPropagation(); copyAlbumUrl(program); }}><Copy size={14} /></Button>
                  <a href={`/digital-album/${program.id}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="ghost"><ExternalLink size={14} /></Button>
                  </a>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Images Panel */}
        <div className="lg:col-span-2">
          {selectedProgram ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg">{selectedProgram.name}</h2>
                  <p className="text-sm text-muted-foreground">{programImages.length} images</p>
                </div>
                <Button size="sm" onClick={() => setIsImageDialogOpen(true)}>
                  <Plus size={16} className="mr-2" /> Add Images
                </Button>
              </div>
              {programImages.length === 0 ? (
                <div className="text-center py-20 bg-muted/50 rounded-xl">
                  <Image className="mx-auto text-muted-foreground mb-4" size={48} />
                  <p className="text-muted-foreground mb-4">No images yet</p>
                  <Button size="sm" onClick={() => setIsImageDialogOpen(true)}>Add First Image</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {programImages.map((image, index) => (
                    <motion.div key={image.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }} className="relative group aspect-square rounded-lg overflow-hidden">
                      <img src={image.image_url} alt={image.caption || ''} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button size="icon" variant="secondary" onClick={() => handleDeleteImage(image.id)}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">{index + 1}</div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/50 rounded-xl">
              <Calendar className="mx-auto text-muted-foreground mb-4" size={64} />
              <p className="text-muted-foreground">Select an album to manage images</p>
            </div>
          )}
        </div>
      </div>

      {/* Program Dialog */}
      <Dialog open={isProgramDialogOpen} onOpenChange={setIsProgramDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProgram ? 'Edit Album' : 'Create Album'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Album Name *</Label>
              <Input value={programFormData.name} onChange={e => {
                const name = e.target.value;
                setProgramFormData({ ...programFormData, name, slug: programFormData.slug ? programFormData.slug : generateSlug(name) });
              }} placeholder="Wedding - John & Jane" />
            </div>
            <div className="space-y-2">
              <Label>Client Name</Label>
              <Input value={programFormData.client_name} onChange={e => setProgramFormData({ ...programFormData, client_name: e.target.value })} placeholder="John & Jane" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Date</Label>
                <Input type="date" value={programFormData.event_date} onChange={e => setProgramFormData({ ...programFormData, event_date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={programFormData.slug} onChange={e => setProgramFormData({ ...programFormData, slug: e.target.value })} placeholder="john-jane-wedding" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input value={programFormData.cover_image_url} onChange={e => setProgramFormData({ ...programFormData, cover_image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Background Music URL</Label>
              <Input value={programFormData.music_url} onChange={e => setProgramFormData({ ...programFormData, music_url: e.target.value })} placeholder="https://example.com/music.mp3" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={programFormData.description} onChange={e => setProgramFormData({ ...programFormData, description: e.target.value })} placeholder="Event description..." />
            </div>
            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch checked={programFormData.is_published} onCheckedChange={checked => setProgramFormData({ ...programFormData, is_published: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProgramDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveProgram}><Save size={16} className="mr-2" /> Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog - Single + Bulk */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Images</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Single Image URL</Label>
              <Input value={imageFormData.image_url} onChange={e => setImageFormData({ ...imageFormData, image_url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input value={imageFormData.caption} onChange={e => setImageFormData({ ...imageFormData, caption: e.target.value })} placeholder="Optional caption" />
            </div>
            {imageFormData.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img src={imageFormData.image_url} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}
            <Button onClick={handleAddImage} disabled={!imageFormData.image_url} className="w-full">
              <Plus size={16} className="mr-2" /> Add Single Image
            </Button>

            <div className="relative my-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">or bulk add</span></div></div>

            <div className="space-y-2">
              <Label>Paste multiple URLs (one per line)</Label>
              <Textarea value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} placeholder="https://image1.jpg&#10;https://image2.jpg&#10;https://image3.jpg" rows={5} />
            </div>
            <Button onClick={handleBulkAddImages} disabled={!bulkUrls.trim()} variant="outline" className="w-full">
              <Plus size={16} className="mr-2" /> Add All URLs
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code - {selectedProgram?.name}</DialogTitle>
          </DialogHeader>
          {selectedProgram && (
            <div className="py-4 text-center space-y-4">
              <img src={getQrUrl(selectedProgram)} alt="QR Code" className="mx-auto w-64 h-64 rounded-lg" />
              <p className="text-sm text-muted-foreground break-all">{`${window.location.origin}/digital-album/${selectedProgram.id}`}</p>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => copyAlbumUrl(selectedProgram)}>
                  <Copy size={14} className="mr-2" /> Copy Link
                </Button>
                <a href={getQrUrl(selectedProgram)} download={`qr-${selectedProgram.slug || selectedProgram.id}.png`}>
                  <Button>Download QR</Button>
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProgramsManager;
