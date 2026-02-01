import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Palette, Mail, Phone, MapPin, Globe, Link2, Image } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { StudioSettings } from '@/types/database';

const SettingsManager: React.FC = () => {
  const { currentStudio, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studioData, setStudioData] = useState({
    name: '',
    slug: '',
    is_public: true,
  });
  const [settings, setSettings] = useState<Partial<StudioSettings>>({
    logo_url: '',
    primary_color: '#D4AF37',
    secondary_color: '#1a1a2e',
    accent_color: '#f5f5f5',
    contact_email: '',
    contact_phone: '',
    address: '',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    social_facebook: '',
    social_instagram: '',
    social_youtube: '',
    google_drive_folder: '',
    webhook_url: '',
  });

  useEffect(() => {
    if (currentStudio?.id) {
      fetchSettings();
    }
  }, [currentStudio?.id]);

  const fetchSettings = async () => {
    if (!currentStudio?.id) return;
    
    try {
      setStudioData({
        name: currentStudio.name,
        slug: currentStudio.slug,
        is_public: currentStudio.is_public,
      });

      const { data, error } = await supabase
        .from('studio_settings')
        .select('*')
        .eq('studio_id', currentStudio.id)
        .maybeSingle();

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentStudio?.id) return;

    setSaving(true);
    try {
      // Update studio
      const { error: studioError } = await supabase
        .from('studios')
        .update({
          name: studioData.name,
          slug: studioData.slug,
          is_public: studioData.is_public,
        })
        .eq('id', currentStudio.id);

      if (studioError) throw studioError;

      // Update or insert settings
      const { data: existingSettings } = await supabase
        .from('studio_settings')
        .select('id')
        .eq('studio_id', currentStudio.id)
        .maybeSingle();

      const settingsPayload = {
        studio_id: currentStudio.id,
        ...settings,
      };

      if (existingSettings) {
        const { error } = await supabase
          .from('studio_settings')
          .update(settingsPayload)
          .eq('id', existingSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('studio_settings')
          .insert(settingsPayload);
        if (error) throw error;
      }

      toast({ title: 'Success', description: 'Settings saved successfully' });
      refreshUserData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Studio Settings</h1>
          <p className="text-muted-foreground">Manage your studio configuration</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={18} className="mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              General Information
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Studio Name</Label>
                <Input
                  value={studioData.name}
                  onChange={e => setStudioData({ ...studioData, name: e.target.value })}
                  placeholder="My Photography Studio"
                />
              </div>
              <div className="space-y-2">
                <Label>URL Slug</Label>
                <Input
                  value={studioData.slug}
                  onChange={e => setStudioData({ ...studioData, slug: e.target.value })}
                  placeholder="my-studio"
                />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Image size={18} className="text-primary" />
              Logo & Branding
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Logo URL</Label>
                <Input
                  value={settings.logo_url || ''}
                  onChange={e => setSettings({ ...settings, logo_url: e.target.value })}
                  placeholder="https://..."
                />
                {settings.logo_url && (
                  <div className="w-32 h-32 rounded-lg border p-2">
                    <img
                      src={settings.logo_url}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <h3 className="font-semibold flex items-center gap-2 mt-6">
              <Palette size={18} className="text-primary" />
              Colors
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.primary_color || '#D4AF37'}
                    onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.primary_color || '#D4AF37'}
                    onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                    placeholder="#D4AF37"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.secondary_color || '#1a1a2e'}
                    onChange={e => setSettings({ ...settings, secondary_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.secondary_color || '#1a1a2e'}
                    onChange={e => setSettings({ ...settings, secondary_color: e.target.value })}
                    placeholder="#1a1a2e"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Accent Color</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={settings.accent_color || '#f5f5f5'}
                    onChange={e => setSettings({ ...settings, accent_color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={settings.accent_color || '#f5f5f5'}
                    onChange={e => setSettings({ ...settings, accent_color: e.target.value })}
                    placeholder="#f5f5f5"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-4"
          >
            <h3 className="font-semibold">Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail size={14} /> Email
                </Label>
                <Input
                  type="email"
                  value={settings.contact_email || ''}
                  onChange={e => setSettings({ ...settings, contact_email: e.target.value })}
                  placeholder="hello@studio.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone size={14} /> Phone
                </Label>
                <Input
                  value={settings.contact_phone || ''}
                  onChange={e => setSettings({ ...settings, contact_phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin size={14} /> Address
              </Label>
              <Textarea
                value={settings.address || ''}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                placeholder="Enter your studio address"
              />
            </div>

            <h3 className="font-semibold mt-6">Social Links</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input
                  value={settings.social_facebook || ''}
                  onChange={e => setSettings({ ...settings, social_facebook: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input
                  value={settings.social_instagram || ''}
                  onChange={e => setSettings({ ...settings, social_instagram: e.target.value })}
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input
                  value={settings.social_youtube || ''}
                  onChange={e => setSettings({ ...settings, social_youtube: e.target.value })}
                  placeholder="https://youtube.com/..."
                />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-4"
          >
            <h3 className="font-semibold">SEO Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={settings.meta_title || ''}
                  onChange={e => setSettings({ ...settings, meta_title: e.target.value })}
                  placeholder="My Studio - Wedding Photography & Videography"
                />
                <p className="text-xs text-muted-foreground">
                  {(settings.meta_title || '').length}/60 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={settings.meta_description || ''}
                  onChange={e => setSettings({ ...settings, meta_description: e.target.value })}
                  placeholder="Professional wedding photography and videography services..."
                />
                <p className="text-xs text-muted-foreground">
                  {(settings.meta_description || '').length}/160 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label>Meta Keywords</Label>
                <Input
                  value={settings.meta_keywords || ''}
                  onChange={e => setSettings({ ...settings, meta_keywords: e.target.value })}
                  placeholder="wedding photography, videography, candid photos"
                />
              </div>
            </div>
          </motion.div>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-4"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Link2 size={18} className="text-primary" />
              Integrations
            </h3>
            <p className="text-sm text-muted-foreground">
              Configure integrations for automation features
            </p>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Google Drive Folder Link</Label>
                <Input
                  value={settings.google_drive_folder || ''}
                  onChange={e => setSettings({ ...settings, google_drive_folder: e.target.value })}
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Used for the "Find Your Photos" feature
                </p>
              </div>
              <div className="space-y-2">
                <Label>Webhook URL</Label>
                <Input
                  value={settings.webhook_url || ''}
                  onChange={e => setSettings({ ...settings, webhook_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground">
                  Receive notifications when new requests come in
                </p>
              </div>
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsManager;
