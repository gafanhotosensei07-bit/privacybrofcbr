
-- Add column to track recovery email count and last sent time
ALTER TABLE public.checkout_attempts 
ADD COLUMN IF NOT EXISTS recovery_email_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.checkout_attempts 
ADD COLUMN IF NOT EXISTS recovery_email_last_sent_at timestamp with time zone;
