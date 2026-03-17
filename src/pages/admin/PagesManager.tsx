import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, GripVertical, Layout, Save, Globe, Navigation } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface PageRow {
  id: string;
  studio_id: string;
  title: string;
  slug: string;
  content: string;
  is_published: boolean;
  show_in_nav: boolean;
  sort_order: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

const PagesManager: React.FC = () => {
  const { studio } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<PageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PageRow | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    is_published: false,
    show_in_nav: true,
    sort_order: 0,
    meta_title: '',
    meta_description: '',
  });

  useEffect(() => {
    if (studio?.id) fetchPages();
  }, [studio?.id]);

  const fetchPages = async () => {
    if (!studio?.id) return;
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('studio_id', studio.id)
        .order('sort_order');
      if (error) throw error;
      setPages((data || []) as PageRow[]);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({ title: 'Error', description: 'Failed to load pages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const openDialog = (page?: PageRow) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title: page.title,
        slug: page.slug,
        content: page.content || '',
        is_published: page.is_published,
        show_in_nav: page.show_in_nav,
        sort_order: page.sort_order,
        meta_title: page.meta_title || '',
        meta_description: page.meta_description || '',
      });
    } else {
      setEditingPage(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        is_published: false,
        show_in_nav: true,
        sort_order: pages.length,
        meta_title: '',
        meta_description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!studio?.id || !formData.title) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }
    const slug = formData.slug || generateSlug(formData.title);
    try {
      const payload: any = {
        studio_id: studio.id,
        title: formData.title,
        slug,
        content: formData.content,
        is_published: formData.is_published,
        show_in_nav: formData.show_in_nav,
        sort_order: formData.sort_order,
        meta_title: formData.meta_title || null,
        meta_description: formData.meta_description || null,
      };

      if (editingPage) {
        const { error } = await supabase.from('pages').update(payload).eq('id', editingPage.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Page updated successfully' });
      } else {
        const { error } = await supabase.from('pages').insert(payload);
        if (error) throw error;
        toast({ title: 'Success', description: 'Page created successfully' });
      }
      setIsDialogOpen(false);
      fetchPages();
    } catch (error: any) {
      console.error('Error saving page:', error);
      toast({ title: 'Error', description: error.message || 'Failed to save page', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;
    try {
      await supabase.from('page_sections').delete().eq('page_id', id);
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Deleted', description: 'Page deleted successfully' });
      fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({ title: 'Error', description: 'Failed to delete page', variant: 'destructive' });
    }
  };

  const togglePublished = async (page: PageRow) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);
      if (error) throw error;
      toast({ title: page.is_published ? 'Unpublished' : 'Published' });
      fetchPages();
    } catch (error) {
      console.error('Error updating page:', error);
    }
  };

  const toggleNavbar = async (page: PageRow) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ show_in_nav: !page.show_in_nav })
        .eq('id', page.id);
      if (error) throw error;
      toast({ title: page.show_in_nav ? 'Removed from navbar' : 'Added to navbar' });
      fetchPages();
    } catch (error) {
      console.error('Error updating page:', error);
    }
  };

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
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display">Pages</h1>
          <p className="text-muted-foreground text-sm">Create & manage custom pages for your website</p>
        </div>
        <Button onClick={() => openDialog()} className="w-full sm:w-auto">
          <Plus size={18} className="mr-2" />
          New Page
        </Button>
      </div>

      {/* Pages List */}
      <div className="space-y-3">
        {pages.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed border-border">
            <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="font-semibold mb-2 text-lg">No pages yet</h3>
            <p className="text-muted-foreground mb-6 text-sm">Create custom pages like About Us, FAQ, Terms etc.</p>
            <Button onClick={() => openDialog()}>
              <Plus size={18} className="mr-2" />
              Create First Page
            </Button>
          </div>
        ) : (
          pages.map((page, index) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors"
            >
              {/* Left side */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <GripVertical className="text-muted-foreground cursor-grab hidden sm:block flex-shrink-0" size={18} />
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Layout className="text-primary" size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{page.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">/page/{page.slug}</p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {page.show_in_nav && (
                  <span className="px-2 py-0.5 bg-blue-500/15 text-blue-400 rounded text-xs font-medium flex items-center gap-1">
                    <Navigation size={10} /> Nav
                  </span>
                )}
                <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded ${
                  page.is_published ? 'bg-green-500/15 text-green-400' : 'bg-muted text-muted-foreground'
                }`}>
                  {page.is_published ? <Eye size={10} /> : <EyeOff size={10} />}
                  {page.is_published ? 'Live' : 'Draft'}
                </span>
                <span className="text-xs text-muted-foreground">#{page.sort_order}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2">
                <Button variant="ghost" size="icon" onClick={() => togglePublished(page)} title={page.is_published ? 'Unpublish' : 'Publish'}>
                  {page.is_published ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => toggleNavbar(page)} title={page.show_in_nav ? 'Remove from nav' : 'Add to nav'}>
                  <Navigation size={16} className={page.show_in_nav ? 'text-blue-400' : ''} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openDialog(page)}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)}>
                  <Trash2 size={16} className="text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{editingPage ? 'Edit Page' : 'Create Page'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label>Page Title *</Label>
              <Input
                value={formData.title}
                onChange={e => setFormData({
                  ...formData,
                  title: e.target.value,
                  slug: editingPage ? formData.slug : generateSlug(e.target.value),
                  meta_title: formData.meta_title || e.target.value,
                })}
                placeholder="About Us"
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">/page/</span>
                <Input
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  placeholder="about-us"
                />
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>Page Content</Label>
              <Textarea
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your page content here... You can use multiple paragraphs."
                rows={10}
                className="resize-y min-h-[200px]"
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={formData.sort_order}
                onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label className="cursor-pointer">Published</Label>
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={checked => setFormData({ ...formData, is_published: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <Label className="cursor-pointer">Show in Navbar</Label>
                <Switch
                  checked={formData.show_in_nav}
                  onCheckedChange={checked => setFormData({ ...formData, show_in_nav: checked })}
                />
              </div>
            </div>

            {/* SEO Section */}
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Globe size={14} />
                SEO Settings
              </div>
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={formData.meta_title}
                  onChange={e => setFormData({ ...formData, meta_title: e.target.value })}
                  placeholder="Page title for search engines"
                  maxLength={60}
                />
                <p className="text-xs text-muted-foreground">{formData.meta_title.length}/60 characters</p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.meta_description}
                  onChange={e => setFormData({ ...formData, meta_description: e.target.value })}
                  placeholder="Brief description for search engines"
                  rows={2}
                  maxLength={160}
                />
                <p className="text-xs text-muted-foreground">{formData.meta_description.length}/160 characters</p>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" />
              {editingPage ? 'Update Page' : 'Create Page'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagesManager;
