import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, Image, Images, Save, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PortfolioAlbum, PortfolioImage } from '@/types/database';

const PortfolioManager: React.FC = () => {
  const { studio } = useAuth();
  const { toast } = useToast();
  const [albums, setAlbums] = useState<PortfolioAlbum[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<PortfolioAlbum | null>(null);
  const [albumImages, setAlbumImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAlbumDialogOpen, setIsAlbumDialogOpen] = useState(false);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<PortfolioAlbum | null>(null);
  const [albumFormData, setAlbumFormData] = useState({
    name: '',
    description: '',
    category: '',
    cover_image_url: '',
    is_published: false,
  });
  const [imageFormData, setImageFormData] = useState({
    image_url: '',
    caption: '',
  });

  useEffect(() => {
    if (studio?.id) {
      fetchAlbums();
    }
  }, [studio?.id]);

  const fetchAlbums = async () => {
    if (!studio?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('portfolio_albums')
        .select('*')
        .eq('studio_id', studio.id)
        .order('sort_order');

      if (error) throw error;
      setAlbums((data || []) as PortfolioAlbum[]);
    } catch (error) {
      console.error('Error fetching albums:', error);
      toast({ title: 'Error', description: 'Failed to load albums', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumImages = async (albumId: string) => {
    try {
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .eq('album_id', albumId)
        .order('sort_order');

      if (error) throw error;
      setAlbumImages((data || []) as PortfolioImage[]);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const openAlbumDialog = (album?: PortfolioAlbum) => {
    if (album) {
      setEditingAlbum(album);
      setAlbumFormData({
        name: album.name,
        description: album.description || '',
        category: album.category || '',
        cover_image_url: album.cover_image_url || '',
        is_published: album.is_published,
      });
    } else {
      setEditingAlbum(null);
      setAlbumFormData({
        name: '',
        description: '',
        category: '',
        cover_image_url: '',
        is_published: false,
      });
    }
    setIsAlbumDialogOpen(true);
  };

  const handleSaveAlbum = async () => {
    if (!studio?.id || !albumFormData.name) {
      toast({ title: 'Error', description: 'Album name is required', variant: 'destructive' });
      return;
    }

    try {
      const payload = {
        studio_id: studio.id,
        name: albumFormData.name,
        description: albumFormData.description || null,
        category: albumFormData.category || null,
        cover_image_url: albumFormData.cover_image_url || null,
        is_published: albumFormData.is_published,
        sort_order: editingAlbum?.sort_order ?? albums.length,
      };

      if (editingAlbum) {
        const { error } = await supabase
          .from('portfolio_albums')
          .update(payload)
          .eq('id', editingAlbum.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Album updated' });
      } else {
        const { error } = await supabase.from('portfolio_albums').insert(payload);
        if (error) throw error;
        toast({ title: 'Success', description: 'Album created' });
      }

      setIsAlbumDialogOpen(false);
      fetchAlbums();
    } catch (error) {
      console.error('Error saving album:', error);
      toast({ title: 'Error', description: 'Failed to save album', variant: 'destructive' });
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (!confirm('Are you sure? This will delete the album and all its images.')) return;

    try {
      await supabase.from('portfolio_images').delete().eq('album_id', id);
      const { error } = await supabase.from('portfolio_albums').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Album deleted' });
      if (selectedAlbum?.id === id) {
        setSelectedAlbum(null);
        setAlbumImages([]);
      }
      fetchAlbums();
    } catch (error) {
      console.error('Error deleting album:', error);
      toast({ title: 'Error', description: 'Failed to delete album', variant: 'destructive' });
    }
  };

  const handleAddImage = async () => {
    if (!selectedAlbum || !studio?.id || !imageFormData.image_url) {
      toast({ title: 'Error', description: 'Image URL is required', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase.from('portfolio_images').insert({
        studio_id: studio.id,
        album_id: selectedAlbum.id,
        image_url: imageFormData.image_url,
        caption: imageFormData.caption || null,
        sort_order: albumImages.length,
      });

      if (error) throw error;
      toast({ title: 'Success', description: 'Image added' });
      setIsImageDialogOpen(false);
      setImageFormData({ image_url: '', caption: '' });
      fetchAlbumImages(selectedAlbum.id);
    } catch (error) {
      console.error('Error adding image:', error);
      toast({ title: 'Error', description: 'Failed to add image', variant: 'destructive' });
    }
  };

  const handleDeleteImage = async (id: string) => {
    if (!confirm('Delete this image?')) return;

    try {
      const { error } = await supabase.from('portfolio_images').delete().eq('id', id);
      if (error) throw error;
      if (selectedAlbum) fetchAlbumImages(selectedAlbum.id);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  };

  const selectAlbum = (album: PortfolioAlbum) => {
    setSelectedAlbum(album);
    fetchAlbumImages(album.id);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-muted-foreground">Manage your portfolio albums and images</p>
        </div>
        <Button onClick={() => openAlbumDialog()}>
          <Plus size={18} className="mr-2" />
          New Album
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Albums List */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Albums</h2>
          {albums.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-xl">
              <Images className="mx-auto text-muted-foreground mb-4" size={48} />
              <p className="text-muted-foreground">No albums yet</p>
            </div>
          ) : (
            albums.map((album, index) => (
              <motion.div
                key={album.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => selectAlbum(album)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedAlbum?.id === album.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {album.cover_image_url ? (
                      <img
                        src={album.cover_image_url}
                        alt={album.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Images className="text-muted-foreground" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{album.name}</h3>
                    {album.category && (
                      <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                        {album.category}
                      </span>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {album.is_published ? (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <Eye size={12} /> Published
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <EyeOff size={12} /> Draft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={e => { e.stopPropagation(); openAlbumDialog(album); }}
                  >
                    <Pencil size={14} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={e => { e.stopPropagation(); handleDeleteAlbum(album.id); }}
                  >
                    <Trash2 size={14} className="text-destructive" />
                  </Button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Album Images */}
        <div className="lg:col-span-2">
          {selectedAlbum ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-semibold text-lg">{selectedAlbum.name} - Images</h2>
                <Button size="sm" onClick={() => setIsImageDialogOpen(true)}>
                  <Plus size={16} className="mr-2" />
                  Add Image
                </Button>
              </div>

              {albumImages.length === 0 ? (
                <div className="text-center py-20 bg-muted/50 rounded-xl">
                  <Image className="mx-auto text-muted-foreground mb-4" size={48} />
                  <p className="text-muted-foreground mb-4">No images in this album</p>
                  <Button size="sm" onClick={() => setIsImageDialogOpen(true)}>
                    Add First Image
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {albumImages.map((image, index) => (
                    <motion.div
                      key={image.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative group aspect-square rounded-lg overflow-hidden"
                    >
                      <img
                        src={image.image_url}
                        alt={image.caption || ''}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                      {image.caption && (
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                          <p className="text-white text-xs truncate">{image.caption}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/50 rounded-xl">
              <Images className="mx-auto text-muted-foreground mb-4" size={64} />
              <p className="text-muted-foreground">Select an album to view images</p>
            </div>
          )}
        </div>
      </div>

      {/* Album Dialog */}
      <Dialog open={isAlbumDialogOpen} onOpenChange={setIsAlbumDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAlbum ? 'Edit Album' : 'Create Album'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Album Name *</Label>
              <Input
                value={albumFormData.name}
                onChange={e => setAlbumFormData({ ...albumFormData, name: e.target.value })}
                placeholder="Wedding - John & Jane"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input
                value={albumFormData.category}
                onChange={e => setAlbumFormData({ ...albumFormData, category: e.target.value })}
                placeholder="Wedding, Pre-Wedding, etc."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={albumFormData.description}
                onChange={e => setAlbumFormData({ ...albumFormData, description: e.target.value })}
                placeholder="A beautiful wedding ceremony..."
              />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input
                value={albumFormData.cover_image_url}
                onChange={e => setAlbumFormData({ ...albumFormData, cover_image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch
                checked={albumFormData.is_published}
                onCheckedChange={checked => setAlbumFormData({ ...albumFormData, is_published: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAlbumDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAlbum}>
              <Save size={16} className="mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Image URL *</Label>
              <Input
                value={imageFormData.image_url}
                onChange={e => setImageFormData({ ...imageFormData, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Caption</Label>
              <Input
                value={imageFormData.caption}
                onChange={e => setImageFormData({ ...imageFormData, caption: e.target.value })}
                placeholder="Optional caption"
              />
            </div>
            {imageFormData.image_url && (
              <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={imageFormData.image_url}
                  alt="Preview"
                  className="w-full h-full object-contain"
                  onError={e => (e.currentTarget.src = '')}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddImage}>
              <Plus size={16} className="mr-2" />
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PortfolioManager;
