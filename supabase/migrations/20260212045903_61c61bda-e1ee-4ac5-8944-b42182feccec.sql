
-- Track page views for analytics
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type TEXT NOT NULL DEFAULT '',
  page_slug TEXT NOT NULL DEFAULT '',
  referrer TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (tracking doesn't require auth)
CREATE POLICY "Allow anonymous page view inserts"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

-- Block direct reads (only via service role in admin)
CREATE POLICY "No direct reads"
  ON public.page_views FOR SELECT
  USING (false);
