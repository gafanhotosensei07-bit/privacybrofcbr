
-- Add expiration column to checkout_attempts
ALTER TABLE public.checkout_attempts
ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;

-- Backfill existing approved records based on plan_name
UPDATE public.checkout_attempts
SET expires_at = CASE
  WHEN plan_name ILIKE '%seman%' THEN created_at + INTERVAL '7 days'
  WHEN plan_name ILIKE '%3 mes%' OR plan_name ILIKE '%3 meses%' OR plan_name ILIKE '%trimestral%' THEN created_at + INTERVAL '90 days'
  WHEN plan_name ILIKE '%1 ano%' OR plan_name ILIKE '%ano%' OR plan_name ILIKE '%anual%' THEN created_at + INTERVAL '365 days'
  ELSE created_at + INTERVAL '30 days'
END
WHERE payment_status = 'approved' AND expires_at IS NULL;
