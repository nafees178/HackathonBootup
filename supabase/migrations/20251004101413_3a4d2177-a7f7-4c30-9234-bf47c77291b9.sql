-- Add new values to request_type enum
ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'money_for_skill';
ALTER TYPE request_type ADD VALUE IF NOT EXISTS 'money_for_item';