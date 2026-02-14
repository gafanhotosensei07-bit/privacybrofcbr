
CREATE TABLE public.monitored_domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.monitored_domains ENABLE ROW LEVEL SECURITY;

-- Only accessible via service role (admin edge function)
CREATE POLICY "No direct access" ON public.monitored_domains FOR SELECT USING (false);
