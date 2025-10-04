-- Create storage bucket for message images
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-images', 'message-images', true);

-- Add image_url column to messages table
ALTER TABLE public.messages
ADD COLUMN image_url TEXT;

-- Create RLS policies for message images
CREATE POLICY "Users can upload their own message images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'message-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Message images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'message-images');

CREATE POLICY "Users can delete their own message images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'message-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);