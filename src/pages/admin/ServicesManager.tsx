import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Image, DollarSign, Save, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Service } from '@/types/database';

const ServicesManager: React.FC = () => {
  const { currentStudio } = useAuth();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    images: ['', '', '', '', ''],
    is_visible: true,
  });

  useEffect(() => {
    if (currentStudio?.id) {
      fetchServices();
    }
  }, [currentStudio?.id]);

  const fetchServices = async () => {
    if (!currentStudio?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('studio_id', currentStudio.id)
        .order('sort_order');

      if (error) throw error;
      setServices((data || []) as Service[]);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({ title: 'Error', description: 'Failed to load services', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      const images = (service.images as string[]) || [];
      setFormData({
        title: service.title,
        description: service.description || '',
        price: service.price?.toString() || '',
        images: [...images, ...Array(5 - images.length).fill('')].slice(0, 5),
        is_visible: service.is_visible,
      });
    } else {
      setEditingService(null);
      setFormData({
        title: '',
        description: '',
        price: '',
        images: ['', '', '', '', ''],
        is_visible: true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!currentStudio?.id || !formData.title) {
      toast({ title: 'Error', description: 'Title is required', variant: 'destructive' });
      return;
    }

    try {
      const images = formData.images.filter(img => img.trim() !== '');
      const payload = {
        studio_id: currentStudio.id,
        title: formData.title,
        description: formData.description || null,
        price: formData.price ? parseFloat(formData.price) : null,
        images,
        is_visible: formData.is_visible,
        sort_order: editingService?.sort_order ?? services.length,
      };

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(payload)
          .eq('id', editingService.id);
        if (error) throw error;
        toast({ title: 'Success', description: 'Service updated' });
      } else {
        const { error } = await supabase.from('services').insert(payload);
        if (error) throw error;
        toast({ title: 'Success', description: 'Service created' });
      }

      setIsDialogOpen(false);
      fetchServices();
    } catch (error) {
      console.error('Error saving service:', error);
      toast({ title: 'Error', description: 'Failed to save service', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Service deleted' });
      fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({ title: 'Error', description: 'Failed to delete service', variant: 'destructive' });
    }
  };

  const toggleVisibility = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_visible: !service.is_visible })
        .eq('id', service.id);
      if (error) throw error;
      fetchServices();
    } catch (error) {
      console.error('Error updating visibility:', error);
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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your studio services</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus size={18} className="mr-2" />
          Add Service
        </Button>
      </div>

      <div className="grid gap-4">
        {services.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <Image className="mx-auto text-muted-foreground mb-4" size={48} />
            <h3 className="font-semibold mb-2">No services yet</h3>
            <p className="text-muted-foreground mb-4">Create your first service to get started</p>
            <Button onClick={() => openDialog()}>
              <Plus size={18} className="mr-2" />
              Add Service
            </Button>
          </div>
        ) : (
          services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg"
            >
              <GripVertical className="text-muted-foreground cursor-grab" size={20} />
              
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {(service.images as string[])?.[0] ? (
                  <img
                    src={(service.images as string[])[0]}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="text-muted-foreground" size={24} />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{service.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {service.description || 'No description'}
                </p>
                {service.price && (
                  <p className="text-sm text-primary font-medium">
                    ₹{service.price.toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleVisibility(service)}
                  title={service.is_visible ? 'Hide' : 'Show'}
                >
                  {service.is_visible ? <Eye size={18} /> : <EyeOff size={18} />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => openDialog(service)}>
                  <Pencil size={18} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(service.id)}>
                  <Trash2 size={18} className="text-destructive" />
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Service Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Wedding Photography"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe your service..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  placeholder="25000"
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image URLs</Label>
              <div className="space-y-2">
                {formData.images.map((url, idx) => (
                  <Input
                    key={idx}
                    value={url}
                    onChange={e => {
                      const newImages = [...formData.images];
                      newImages[idx] = e.target.value;
                      setFormData({ ...formData, images: newImages });
                    }}
                    placeholder={`Image URL ${idx + 1}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Add up to 5 image URLs for your service
              </p>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="visible">Visible on website</Label>
              <Switch
                id="visible"
                checked={formData.is_visible}
                onCheckedChange={checked => setFormData({ ...formData, is_visible: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save size={18} className="mr-2" />
              {editingService ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManager;
