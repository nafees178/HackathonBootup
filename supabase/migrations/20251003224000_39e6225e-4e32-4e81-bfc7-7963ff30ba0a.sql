-- Create request_interests table for multiple users to express interest
CREATE TABLE IF NOT EXISTS public.request_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(request_id, user_id)
);

-- Enable RLS
ALTER TABLE public.request_interests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for request_interests
CREATE POLICY "Users can view interests for their requests"
ON public.request_interests FOR SELECT
USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT user_id FROM requests WHERE id = request_id)
);

CREATE POLICY "Authenticated users can express interest"
ON public.request_interests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Request owners can update interests"
ON public.request_interests FOR UPDATE
USING (
  auth.uid() IN (SELECT user_id FROM requests WHERE id = request_id)
);

-- Create conversations table for two-way messaging
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant1_id UUID NOT NULL,
  participant2_id UUID NOT NULL,
  request_id UUID REFERENCES requests(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(participant1_id, participant2_id, request_id)
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

-- Update messages table to reference conversations
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Add deal verification columns
ALTER TABLE public.deals
ADD COLUMN IF NOT EXISTS requester_task_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepter_task_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS requester_verified_accepter BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepter_verified_requester BOOLEAN DEFAULT false;

-- Trigger to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = NOW() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
WHEN (NEW.conversation_id IS NOT NULL)
EXECUTE FUNCTION update_conversation_timestamp();