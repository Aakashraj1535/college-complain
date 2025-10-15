-- Add is_anonymous column to complaints table
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Create storage bucket for complaint attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'complaint-attachments',
  'complaint-attachments',
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for complaint attachments
CREATE POLICY "Students can upload their complaint attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'complaint-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view attachments of complaints they can access"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'complaint-attachments' AND
  (
    -- Students can see their own
    auth.uid()::text = (storage.foldername(name))[1] OR
    -- Faculty and admins can see all
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'faculty'::app_role)
  )
);

CREATE POLICY "Users can delete their own complaint attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'complaint-attachments' AND
  auth.uid()::text = (storage.foldername(name))[1]
);