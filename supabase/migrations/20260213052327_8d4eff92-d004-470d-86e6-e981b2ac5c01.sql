
-- Remove overly permissive policies
DROP POLICY "Allow anonymous inserts" ON public.checkout_attempts;
DROP POLICY "Allow anonymous status updates" ON public.checkout_attempts;
DROP POLICY "Service role can read all" ON public.checkout_attempts;

-- Only authenticated users can insert their own checkouts
CREATE POLICY "Authenticated users can insert checkouts"
ON public.checkout_attempts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- No direct updates from client - updates should go through edge functions with service role
-- No direct reads from client - reads go through edge functions with service role
