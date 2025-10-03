-- Add cancellation request tracking to deals
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS cancellation_requested_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancellation_agreed boolean DEFAULT false;