-- Add college-specific fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS college_year text,
ADD COLUMN IF NOT EXISTS branch text,
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS hostel text;

-- Drop old work/education columns if they exist
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS work_experience,
DROP COLUMN IF EXISTS education;