import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Palette, Mail, Phone, MapPin, Globe, Link2, Image, Database, Server, Key, Eye, EyeOff } from 'lucide-react';
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
  const { studio, refreshUserData } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showMongoUri, setShowMongoUri] = useState(false);
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
    mongodb_uri: '',
    python_api_url: '',
    google_service_account_key: '',
    theme_type: 'gradient',
    gradient_angle: 45,
  });

  useEffect(() => {
    if (studio?.id) {
      fetchSettings();
    }
  }, [studio?.id]);

  const fetchSettings = async () => {
    if (!studio?.id) return;
    
    try {
      setStudioData({
        name: studio.name,
        slug: studio.slug,
        is_public: studio.is_public,
      });

      const { data, error } = await supabase
        .from('studio_settings')
        .select('*')
        .eq('studio_id', studio.id)
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
    if (!studio?.id) return;

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
        .eq('id', studio.id);

      if (studioError) throw studioError;

      // Update or insert settings
      const { data: existingSettings } = await supabase
        .from('studio_settings')
        .select('id')
        .eq('studio_id', studio.id)
        .maybeSingle();

      const settingsPayload = {
        studio_id: studio.id,
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
          <TabsTrigger value="theme">Theme</TabsTrigger>
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

        <TabsContent value="theme" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6 space-y-6"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Palette size={18} className="text-primary" />
              Theme Configuration
            </h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme Type</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={(settings as any).theme_type === 'solid'}
                      onChange={() => setSettings({ ...settings, theme_type: 'solid' } as any)}
                    />
                    <span className="text-sm">Solid Color</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={(settings as any).theme_type === 'gradient'}
                      onChange={() => setSettings({ ...settings, theme_type: 'gradient' } as any)}
                    />
                    <span className="text-sm">Gradient</span>
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={settings.primary_color || '#D4AF37'}
                      onChange={e => setSettings({ ...settings, primary_color: e.target.value })}
                      className="w-16 h-10 p-1 cursor-pointer"
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
                      className="w-16 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={settings.secondary_color || '#1a1a2e'}
                      onChange={e => setSettings({ ...settings, secondary_color: e.target.value })}
                      placeholder="#1a1a2e"
                    />
                  </div>
                </div>
              </div>

              {(settings as any).theme_type === 'gradient' && (
                <div className="space-y-2">
                  <Label>Gradient Angle: {(settings as any).gradient_angle || 45}°</Label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={(settings as any).gradient_angle || 45}
                    onChange={e => setSettings({ ...settings, gradient_angle: parseInt(e.target.value) } as any)}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Live Preview</Label>
                <div
                  className="h-32 rounded-lg border flex flex-col items-center justify-center text-white font-semibold gap-2"
                  style={{
                    background: (settings as any).theme_type === 'gradient'
                      ? `linear-gradient(${(settings as any).gradient_angle || 45}deg, ${settings.primary_color}, ${settings.secondary_color})`
                      : settings.primary_color
                  }}
                >
                  <span className="text-2xl">{studioData.name}</span>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white/20 backdrop-blur rounded-lg text-sm hover:bg-white/30 transition-colors">
                      Button Preview
                    </button>
                    <button className="px-4 py-2 bg-white text-gray-900 rounded-lg text-sm hover:bg-white/90 transition-colors">
                      CTA Button
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg border">
                <h4 className="text-sm font-semibold mb-3">Theme Presets</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => setSettings({ ...settings, primary_color: '#D4AF37', secondary_color: '#1a1a2e', theme_type: 'gradient', gradient_angle: 45 } as any)}
                    className="p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="h-16 w-full rounded mb-2" style={{ background: 'linear-gradient(45deg, #D4AF37, #1a1a2e)' }} />
                    <span className="text-xs font-medium">Gold Luxury</span>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, primary_color: '#2d2d2d', secondary_color: '#0a0a0a', theme_type: 'gradient', gradient_angle: 135 } as any)}
                    className="p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="h-16 w-full rounded mb-2" style={{ background: 'linear-gradient(135deg, #2d2d2d, #0a0a0a)' }} />
                    <span className="text-xs font-medium">Dark Pro</span>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, primary_color: '#ff6b6b', secondary_color: '#ffd93d', theme_type: 'gradient', gradient_angle: 90 } as any)}
                    className="p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="h-16 w-full rounded mb-2" style={{ background: 'linear-gradient(90deg, #ff6b6b, #ffd93d)' }} />
                    <span className="text-xs font-medium">Wedding Soft</span>
                  </button>
                  <button
                    onClick={() => setSettings({ ...settings, primary_color: '#f5f5f5', secondary_color: '#ffffff', theme_type: 'solid', gradient_angle: 0 } as any)}
                    className="p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="h-16 w-full rounded mb-2 bg-gray-100" />
                    <span className="text-xs font-medium">Minimal White</span>
                  </button>
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
            className="glass-card p-6 space-y-6"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Link2 size={18} className="text-primary" />
              Google Drive Integration
            </h3>
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

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Database size={18} className="text-primary" />
                AI Face Recognition - MongoDB
              </h3>
              <div className="space-y-2">
                <Label>MongoDB Connection URI</Label>
                <div className="relative">
                  <Input
                    type={showMongoUri ? 'text' : 'password'}
                    value={(settings as any).mongodb_uri || ''}
                    onChange={e => setSettings({ ...settings, mongodb_uri: e.target.value } as any)}
                    placeholder="mongodb+srv://user:pass@cluster.mongodb.net/dbname"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMongoUri(!showMongoUri)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showMongoUri ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  MongoDB connection string for storing face embeddings & event data
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Server size={18} className="text-primary" />
                AI Face Recognition - Python API
              </h3>
              <div className="space-y-2">
                <Label>Python API Server URL</Label>
                <Input
                  value={(settings as any).python_api_url || ''}
                  onChange={e => setSettings({ ...settings, python_api_url: e.target.value } as any)}
                  placeholder="https://your-server.com/api"
                />
                <p className="text-xs text-muted-foreground">
                  Self-hosted DeepFace API server endpoint for face embedding generation & matching
                </p>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Key size={18} className="text-primary" />
                Google Service Account
              </h3>
              <div className="space-y-2">
                <Label>Service Account JSON Key</Label>
                <div className="relative">
                  <textarea
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
                    value={(settings as any).google_service_account_key || ''}
                    onChange={e => setSettings({ ...settings, google_service_account_key: e.target.value } as any)}
                    placeholder='{"type": "service_account", "project_id": "...", ...}'
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Paste your Google Cloud Service Account JSON key for Drive API access
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
