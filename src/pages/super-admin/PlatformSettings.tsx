import React, { useEffect, useState } from 'react';
import { Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PlatformSettings: React.FC = () => {
  const [platformName, setPlatformName] = useState('StudioSaaS');
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('platform_settings').select('*').limit(1).maybeSingle();
      if (data) {
        setPlatformName(data.platform_name || 'StudioSaaS');
        setSettingsId(data.id);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    if (settingsId) {
      await supabase.from('platform_settings').update({ platform_name: platformName }).eq('id', settingsId);
    } else {
      const { data } = await supabase.from('platform_settings').insert({ platform_name: platformName }).select().single();
      if (data) setSettingsId(data.id);
    }
    toast({ title: 'Settings Saved!' });
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground">Configure global platform settings</p>
      </div>

      <div className="admin-card max-w-lg space-y-6">
        <div className="space-y-2">
          <Label>Platform Name</Label>
          <Input value={platformName} onChange={e => setPlatformName(e.target.value)} placeholder="StudioSaaS" />
        </div>

        <Button className="btn-premium" onClick={handleSave} disabled={saving}>
          <Save size={18} className="mr-2" /> {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
};

export default PlatformSettings;
