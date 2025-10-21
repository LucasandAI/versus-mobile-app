-- Create a function to get weekly distance for a user
CREATE OR REPLACE FUNCTION public.get_weekly_distance(
  user_id uuid,
  start_date timestamp with time zone,
  end_date timestamp with time zone
) 
RETURNS numeric AS $$
DECLARE
  total_distance numeric;
BEGIN
  SELECT COALESCE(SUM(distance), 0) INTO total_distance
  FROM match_distances
  WHERE 
    user_id = $1 
    AND timestamp >= $2 
    AND timestamp <= $3;
    
  RETURN ROUND(CAST(total_distance AS numeric), 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
