
ALTER TABLE public.studio_settings 
ADD COLUMN IF NOT EXISTS mongodb_uri text,
ADD COLUMN IF NOT EXISTS python_api_url text,
ADD COLUMN IF NOT EXISTS google_service_account_key text;
