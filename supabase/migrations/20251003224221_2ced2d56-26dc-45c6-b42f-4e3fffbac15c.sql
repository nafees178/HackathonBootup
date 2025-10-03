-- Add foreign key to profiles table for request_interests
ALTER TABLE public.request_interests
ADD CONSTRAINT request_interests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;