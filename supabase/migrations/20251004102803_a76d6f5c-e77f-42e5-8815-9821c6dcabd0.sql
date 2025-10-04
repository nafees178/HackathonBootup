-- Fix RLS policy for deals table to allow requesters to create deals
-- The current policy only allows accepters to create deals, but requesters
-- need to create deals when they accept someone's interest

-- Drop the old policy
DROP POLICY IF EXISTS "Authenticated users can create deals" ON deals;

-- Create new policy that allows both requesters and accepters to create deals
CREATE POLICY "Users can create deals as requester or accepter" 
ON deals 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = requester_id OR auth.uid() = accepter_id
);