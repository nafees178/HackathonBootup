-- Create storage bucket for request images
INSERT INTO storage.buckets (id, name, public)
VALUES ('request-images', 'request-images', true);

-- RLS policies for request images
CREATE POLICY "Anyone can view request images"
ON storage.objects FOR SELECT
USING (bucket_id = 'request-images');

CREATE POLICY "Authenticated users can upload request images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'request-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own request images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'request-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own request images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'request-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add new columns to requests table
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS images text[],
ADD COLUMN IF NOT EXISTS pickup_location text,
ADD COLUMN IF NOT EXISTS dropoff_location text;