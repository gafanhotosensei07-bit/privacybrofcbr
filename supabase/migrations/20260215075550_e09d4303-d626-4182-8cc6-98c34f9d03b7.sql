
-- Make the model-content bucket private
UPDATE storage.buckets SET public = false WHERE id = 'model-content';

-- Drop the old public read policy
DROP POLICY IF EXISTS "Public read access for model content" ON storage.objects;

-- Allow admin uploads via service role (no RLS policy needed, service role bypasses RLS)
-- Allow authenticated users with approved checkout to read via signed URLs (handled in edge function)
