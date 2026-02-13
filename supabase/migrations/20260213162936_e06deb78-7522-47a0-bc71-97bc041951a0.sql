
-- Add user_id column (nullable since anonymous checkouts are allowed)
ALTER TABLE public.checkout_attempts ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Drop the old permissive insert policy
DROP POLICY IF EXISTS "Authenticated users can insert checkouts" ON public.checkout_attempts;

-- New INSERT policy: authenticated users can insert with their own user_id
CREATE POLICY "Users can insert own checkouts"
ON public.checkout_attempts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow service role edge function inserts (bypasses RLS automatically)
-- Allow users to SELECT their own checkout attempts
CREATE POLICY "Users can view own checkouts"
ON public.checkout_attempts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
