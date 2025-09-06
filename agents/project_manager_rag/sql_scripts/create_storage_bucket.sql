-- Create storage bucket for meeting transcripts
-- Run this in Supabase SQL Editor

-- Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'transcripts',
    'transcripts', 
    true,  -- Make it public for easy access
    10485760,  -- 10MB file size limit
    ARRAY['text/plain', 'text/markdown', 'application/json']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for the bucket
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload transcripts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'transcripts');

-- Allow public read access
CREATE POLICY "Allow public to read transcripts"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'transcripts');

-- Allow authenticated users to update/delete their own files
CREATE POLICY "Allow authenticated users to manage their transcripts"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'transcripts')
WITH CHECK (bucket_id = 'transcripts');

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE name = 'transcripts';