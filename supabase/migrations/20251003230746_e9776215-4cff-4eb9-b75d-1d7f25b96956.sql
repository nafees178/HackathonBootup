-- Add 'completed' status to request_status enum
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'completed';

-- Add 'completed' status to deal_status enum if it doesn't exist
ALTER TYPE deal_status ADD VALUE IF NOT EXISTS 'completed';