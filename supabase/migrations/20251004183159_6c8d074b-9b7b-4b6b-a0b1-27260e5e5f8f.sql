-- Create storage bucket for payment QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-qr', 'payment-qr', true);

-- Add payment_qr_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN payment_qr_url TEXT;

-- Create RLS policies for payment QR images
CREATE POLICY "Users can upload their own payment QR"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'payment-qr' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Payment QR codes are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'payment-qr');

CREATE POLICY "Users can update their own payment QR"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'payment-qr' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own payment QR"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'payment-qr' AND
  auth.uid()::text = (storage.foldername(name))[1]
);