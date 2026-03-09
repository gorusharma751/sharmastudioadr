
-- Create events table
CREATE TABLE public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name text NOT NULL,
  venue text,
  event_date date,
  drive_folder_link text,
  api_event_id text UNIQUE NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Public can view active events of active public studios
CREATE POLICY "Public can view active events"
ON public.events FOR SELECT
USING (
  is_active = true AND EXISTS (
    SELECT 1 FROM studios WHERE studios.id = events.studio_id AND studios.is_active = true AND studios.is_public = true
  )
);

-- Studio members can manage own events
CREATE POLICY "Studio members can manage own events"
ON public.events FOR ALL
USING (is_studio_member(studio_id));

-- Super admins can manage all events
CREATE POLICY "Super admins can manage all events"
ON public.events FOR ALL
USING (is_super_admin());

-- Updated at trigger
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
