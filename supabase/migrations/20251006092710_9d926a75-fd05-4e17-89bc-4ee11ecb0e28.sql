-- First, let's sync the existing data to fix current discrepancies
UPDATE profiles p
SET 
  total_deals = (
    SELECT COUNT(*) 
    FROM deals d 
    WHERE d.requester_id = p.id OR d.accepter_id = p.id
  ),
  completed_deals = (
    SELECT COUNT(*) 
    FROM deals d 
    WHERE (d.requester_id = p.id OR d.accepter_id = p.id) 
    AND d.status = 'completed'
  );

-- Create a function to update profile deal counts
CREATE OR REPLACE FUNCTION update_profile_deal_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update requester's total_deals
  UPDATE profiles
  SET total_deals = (
    SELECT COUNT(*) 
    FROM deals 
    WHERE requester_id = NEW.requester_id OR accepter_id = NEW.requester_id
  )
  WHERE id = NEW.requester_id;
  
  -- Update accepter's total_deals
  UPDATE profiles
  SET total_deals = (
    SELECT COUNT(*) 
    FROM deals 
    WHERE requester_id = NEW.accepter_id OR accepter_id = NEW.accepter_id
  )
  WHERE id = NEW.accepter_id;
  
  -- If deal is completed, update completed_deals
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE profiles
    SET completed_deals = (
      SELECT COUNT(*) 
      FROM deals 
      WHERE (requester_id = NEW.requester_id OR accepter_id = NEW.requester_id) 
      AND status = 'completed'
    )
    WHERE id = NEW.requester_id;
    
    UPDATE profiles
    SET completed_deals = (
      SELECT COUNT(*) 
      FROM deals 
      WHERE (requester_id = NEW.accepter_id OR accepter_id = NEW.accepter_id) 
      AND status = 'completed'
    )
    WHERE id = NEW.accepter_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for when deals are inserted
CREATE TRIGGER on_deal_insert
  AFTER INSERT ON deals
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_deal_counts();

-- Create trigger for when deals are updated (status change)
CREATE TRIGGER on_deal_update
  AFTER UPDATE ON deals
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_profile_deal_counts();