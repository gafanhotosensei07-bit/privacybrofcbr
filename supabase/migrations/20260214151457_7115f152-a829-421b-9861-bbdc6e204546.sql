-- Create storage bucket for model content
INSERT INTO storage.buckets (id, name, public) VALUES ('model-content', 'model-content', true);

-- Allow admin (via service role) to manage all files
-- Public read access for all content
CREATE POLICY "Public read access for model content"
ON storage.objects FOR SELECT
USING (bucket_id = 'model-content');

-- Only authenticated users can upload (admin will use service role)
CREATE POLICY "Authenticated users can upload model content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'model-content');

-- Only authenticated users can delete
CREATE POLICY "Authenticated users can delete model content"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'model-content');
