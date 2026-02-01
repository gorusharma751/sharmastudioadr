import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, FileText, GripVertical, Layout, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Page } from '@/types/database';

const PagesManager: React.FC = () => {
  const { currentStudio } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    is_published: false,
    show_in_nav: true,
  });

  useEffect(() => {
    if (currentStudio?.id) {
      fetchPages();
    }
  }, [currentStudio?.id]);

  const fetchPages = async () => {
    if (!currentStudio?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('pages')
        .select('*')
        .eq('studio_id', currentStudio.id)
        .order('sort_order');

      if (error) throw error;
      setPages((data || []) as Page[]);
    } catch (error) {
      console.error('Error fetching pages:', error);
      toast({ title: 'Error', description: 'Failed to load pages', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const openDialog = (page?: Page) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        title: page.title,
        slug: page.slug,
        is_published: page.is_published,
        show_in_nav: page.show_in_nav,
      });
    } else {
      setEditingPage(null);
      setFormData({
        title: '',
        slug: '',
        is_published: false,
        show_in_nav: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentStudio?.id || !formData.title) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    const slug = formData.slug || generateSlug(formData.title);

    try {
      const payload = {
        studio_id: currentStudio.id,
        title: formData.title,
        slug,
        is_published: formData.is_published,
        show_in_nav: formData.show_in_nav,
        sort_order: editingPage?.sort_order ?? pages.length,
      };

      if (editingPage) {
        const { error } = await supabase
          .from('pages')
          .update(payload)
          .eq('id', editingPage.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Page updated' });
      } else {
        const { error } = await supabase.from('pages').insert(payload);
        if (error) throw error;
        toast({ title: 'Success', description: 'Page created' });
      }

      setIsDialogOpen(false);
      fetchPages();
    } catch (error) {
      console.error('Error saving page:', error);
      toast({ title: 'Error', description: 'Failed to save page', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      await supabase.from('page_sections').delete().eq('page_id', id);
      const { error } = await supabase.from('pages').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Page deleted' });
      fetchPages();
    } catch (error) {
      console.error('Error deleting page:', error);
      toast({ title: 'Error', description: 'Failed to delete page', variant: 'destructive' });
    }
  };

  const togglePublished = async (page: Page) => {
    try {
      const { error } = await supabase
        .from('pages')
        .update({ is_published: !page.is_published })
        .eq('id', page.id);
      if (error) throw error;
      fetchPages();
    } catch (error) {
      console.error('Error updating page:', error);
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Pages</h1>
          <p className="text-muted-foreground">Manage your website pages</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus size={18} className="mr-2" />
          New Page
        </Button>
      </div>

      <div className="grid gap-4">
        {pages.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <FileText className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="font-semibold mb-2">No pages yet</h3>
            <p className="text-muted-foreground mb-4">Create custom pages for your website</p>
            <Button onClick={() => openDialog()}>
              <Plus size={18} className="mr-2" />
              Create Page
            </Button>
          </div>
        ) : (
          pages.map((page, index) => (
            <motion.div
              key={page.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
            >
              <GripVertical className="text-muted-foreground cursor-grab" size={20} />
              
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Layout className="text-primary" size={20} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{page.title}</h3>
                <p className="text-sm text-muted-foreground">/page/{page.slug}</p>
              </div>

              <div className="flex items-center gap-4 text-sm">
                {page.show_in_nav && (
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-500 rounded text-xs">
                    In Nav
                  </span>
                )}
                <span className={`flex items-center gap-1 ${page.is_published ? 'text-green-500' : 'text-muted-foreground'}`}>
                  {page.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                  {page.is_published ? 'Published' : 'Draft'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => togglePublished(page)}
                  title={page.is_published ? 'Unpublish' : 'Publish'}
                >
                  {page.is_published ? <EyeOff size={18} /> : <Eye size={18} />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openDialog(page)}>
                  <Pencil size={18} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(page.id)}>
                  <Trash2 size={18} className="text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Edit Page' : 'Create Page'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Page Title *</Label>
              <Input
                value={formData.title}
                onChange={e => {
                  setFormData({
                    ...formData,
                    title: e.target.value,
                    slug: formData.slug || generateSlug(e.target.value),
                  });
                }}
                placeholder="About Us"
              />
            </div>
            <div className="space-y-2">
              <Label>URL Slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">/page/</span>
                <Input
                  value={formData.slug}
                  onChange={e => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                  placeholder="about-us"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Published</Label>
              <Switch
                checked={formData.is_published}
                onCheckedChange={checked => setFormData({ ...formData, is_published: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show in Navigation</Label>
              <Switch
                checked={formData.show_in_nav}
                onCheckedChange={checked => setFormData({ ...formData, show_in_nav: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              <Save size={16} className="mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PagesManager;
