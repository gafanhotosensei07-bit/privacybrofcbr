
-- Add UTM tracking columns to page_views
ALTER TABLE public.page_views
ADD COLUMN utm_source text DEFAULT '' NOT NULL,
ADD COLUMN utm_medium text DEFAULT '' NOT NULL,
ADD COLUMN utm_campaign text DEFAULT '' NOT NULL,
ADD COLUMN utm_content text DEFAULT '' NOT NULL,
ADD COLUMN utm_term text DEFAULT '' NOT NULL;

-- Index for faster UTM queries
CREATE INDEX idx_page_views_utm_source ON public.page_views(utm_source) WHERE utm_source != '';
CREATE INDEX idx_page_views_utm_campaign ON public.page_views(utm_campaign) WHERE utm_campaign != '';
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
