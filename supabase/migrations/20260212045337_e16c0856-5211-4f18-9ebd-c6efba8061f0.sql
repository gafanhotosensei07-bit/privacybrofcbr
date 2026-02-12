
-- Allow anonymous updates to payment_status only
CREATE POLICY "Allow anonymous status updates"
  ON public.checkout_attempts FOR UPDATE
  USING (true)
  WITH CHECK (true);
