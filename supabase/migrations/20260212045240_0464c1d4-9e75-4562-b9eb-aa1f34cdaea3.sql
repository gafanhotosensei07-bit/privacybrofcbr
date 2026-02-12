
-- Table to track checkout attempts (model + plan chosen)
CREATE TABLE public.checkout_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL DEFAULT '',
  customer_email TEXT NOT NULL DEFAULT '',
  model_name TEXT NOT NULL DEFAULT '',
  plan_name TEXT NOT NULL DEFAULT '',
  plan_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anon (checkout doesn't require auth)
CREATE POLICY "Allow anonymous inserts"
  ON public.checkout_attempts FOR INSERT
  WITH CHECK (true);

-- Only authenticated admins or service role can read
CREATE POLICY "Service role can read all"
  ON public.checkout_attempts FOR SELECT
  USING (false);
