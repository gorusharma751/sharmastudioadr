import React, { useState, useEffect } from 'react';
import { Save, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const AlbumSettingsManager: React.FC = () => {
  const { currentStudio } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    watermark_enabled: true,
    watermark_position: 'bottom-right',
    music_url: '',
    lead_form_enabled: true,
    lead_form_heading: 'Enter your details to view the album',
    lead_form_button_text: 'View Album',
    lead_form_fields: ['name', 'phone'],
    footer_text: 'Powered by StudioSaaS',
  });

  useEffect(() => {
    if (currentStudio?.id) fetchSettings();
  }, [currentStudio?.id]);

  const fetchSettings = async () => {
    if (!currentStudio?.id) return;
    try {
      const { data } = await supabase
        .from('album_settings')
        .select('*')
        .eq('studio_id', currentStudio.id)
        .maybeSingle();

      if (data) {
        setFormData({
          watermark_enabled: data.watermark_enabled ?? true,
          watermark_position: data.watermark_position || 'bottom-right',
          music_url: data.music_url || '',
          lead_form_enabled: data.lead_form_enabled ?? true,
          lead_form_heading: data.lead_form_heading || 'Enter your details to view the album',
          lead_form_button_text: data.lead_form_button_text || 'View Album',
          lead_form_fields: (data.lead_form_fields as string[]) || ['name', 'phone'],
          footer_text: data.footer_text || 'Powered by StudioSaaS',
        });
      }
    } catch (error) {
      console.error('Error fetching album settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentStudio?.id) return;
    setSaving(true);
    try {
      const payload = {
        studio_id: currentStudio.id,
        ...formData,
      };
      const { error } = await supabase
        .from('album_settings')
        .upsert(payload, { onConflict: 'studio_id' });
      if (error) throw error;
      toast({ title: 'Settings saved!' });
    } catch (error) {
      console.error('Error saving:', error);
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleField = (field: string) => {
    const fields = formData.lead_form_fields;
    if (fields.includes(field)) {
      if (fields.length <= 1) return; // must have at least 1 field
      setFormData({ ...formData, lead_form_fields: fields.filter(f => f !== field) });
    } else {
      setFormData({ ...formData, lead_form_fields: [...fields, field] });
    }
  };

  if (loading) {
    return <div className="p-6"><div className="animate-pulse h-64 bg-muted rounded-lg" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Album Settings</h1>
          <p className="text-muted-foreground">Configure album branding, watermark & lead form</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save size={16} className="mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Watermark Settings */}
        <div className="p-6 rounded-xl border border-border space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <Settings size={18} /> Watermark
          </h2>
          <div className="flex items-center justify-between">
            <Label>Enable Watermark</Label>
            <Switch
              checked={formData.watermark_enabled}
              onCheckedChange={v => setFormData({ ...formData, watermark_enabled: v })}
            />
          </div>
          <div className="space-y-2">
            <Label>Watermark Position</Label>
            <Select value={formData.watermark_position} onValueChange={v => setFormData({ ...formData, watermark_position: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Background Music URL</Label>
            <Input
              value={formData.music_url}
              onChange={e => setFormData({ ...formData, music_url: e.target.value })}
              placeholder="https://example.com/music.mp3"
            />
          </div>
          <div className="space-y-2">
            <Label>Footer Text</Label>
            <Input
              value={formData.footer_text}
              onChange={e => setFormData({ ...formData, footer_text: e.target.value })}
              placeholder="Powered by StudioSaaS"
            />
          </div>
        </div>

        {/* Lead Form Settings */}
        <div className="p-6 rounded-xl border border-border space-y-4">
          <h2 className="font-semibold text-lg">Lead Form Settings</h2>
          <div className="flex items-center justify-between">
            <Label>Enable Lead Form</Label>
            <Switch
              checked={formData.lead_form_enabled}
              onCheckedChange={v => setFormData({ ...formData, lead_form_enabled: v })}
            />
          </div>
          <div className="space-y-2">
            <Label>Form Heading</Label>
            <Input
              value={formData.lead_form_heading}
              onChange={e => setFormData({ ...formData, lead_form_heading: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Button Text</Label>
            <Input
              value={formData.lead_form_button_text}
              onChange={e => setFormData({ ...formData, lead_form_button_text: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Form Fields</Label>
            <div className="flex flex-wrap gap-2">
              {['name', 'phone', 'email'].map(field => (
                <Button
                  key={field}
                  size="sm"
                  variant={formData.lead_form_fields.includes(field) ? 'default' : 'outline'}
                  onClick={() => toggleField(field)}
                >
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlbumSettingsManager;
