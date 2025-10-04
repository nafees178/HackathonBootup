-- Remove duplicate conversations, keeping only the oldest one for each pair
-- Step 1: Delete duplicate conversations (keep oldest one for each user pair)
DELETE FROM conversations c1
WHERE c1.id NOT IN (
  SELECT DISTINCT ON (LEAST(participant1_id, participant2_id), GREATEST(participant1_id, participant2_id))
    id
  FROM conversations
  ORDER BY LEAST(participant1_id, participant2_id), GREATEST(participant1_id, participant2_id), created_at ASC
);

-- Step 2: Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS unique_conversation_participants 
ON conversations (LEAST(participant1_id, participant2_id), GREATEST(participant1_id, participant2_id));