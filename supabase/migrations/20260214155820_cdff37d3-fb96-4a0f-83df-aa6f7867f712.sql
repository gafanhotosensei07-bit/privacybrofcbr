-- Allow updates to checkout_attempts (admin uses service role, but we need the policy for completeness)
-- The admin edge function uses service_role_key which bypasses RLS, so no additional policy needed.
-- However, let's ensure the update_checkout_status works by verifying the edge function uses service role.
-- No migration needed - the edge function already uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
SELECT 1;
