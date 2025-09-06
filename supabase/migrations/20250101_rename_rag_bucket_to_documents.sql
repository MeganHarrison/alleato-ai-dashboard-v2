-- Migration to rename rag-documents bucket to documents
-- Note: This requires manual bucket creation in Supabase Dashboard

-- First, drop existing policies for rag-documents
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;

-- Create new bucket 'documents' if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('documents', 'documents', false, 52428800, -- 50MB limit
     ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/json', 'text/csv'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for documents bucket
CREATE POLICY "Users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' AND 
        (auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can view documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents' AND 
        (auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can update documents" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' AND 
        (auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can delete documents" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' AND 
        (auth.uid() IS NOT NULL)
    );

-- Note: After running this migration, you need to:
-- 1. Manually move any existing files from 'rag-documents' to 'documents' bucket in Supabase Dashboard
-- 2. Update all application code references from 'rag-documents' to 'documents'
-- 3. Delete the old 'rag-documents' bucket if no longer needed