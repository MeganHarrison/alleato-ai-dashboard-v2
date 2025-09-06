-- Create storage buckets for RAG system
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('documents', 'documents', false, 52428800, -- 50MB limit
     ARRAY['application/pdf', 'text/plain', 'text/markdown', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'application/json', 'text/csv']),
    ('rag-exports', 'rag-exports', false, 104857600, -- 100MB limit
     ARRAY['application/json', 'text/csv', 'application/zip'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
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

-- Storage policies for rag-exports bucket
CREATE POLICY "Users can create exports" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'rag-exports' AND 
        (auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can view their exports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'rag-exports' AND 
        (auth.uid() IS NOT NULL)
    );

CREATE POLICY "Users can delete their exports" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'rag-exports' AND 
        (auth.uid() IS NOT NULL)
    );