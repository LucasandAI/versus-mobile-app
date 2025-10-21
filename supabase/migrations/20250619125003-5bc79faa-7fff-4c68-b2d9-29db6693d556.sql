
-- Update the notify_on_request_accepted function to include club data in notifications
CREATE OR REPLACE FUNCTION public.notify_on_request_accepted()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  club_name TEXT;
  club_logo TEXT;
BEGIN
  IF NEW.status = 'SUCCESS' AND OLD.status IS DISTINCT FROM 'SUCCESS' THEN
    -- Get club name and logo
    SELECT name, logo INTO club_name, club_logo FROM clubs WHERE id = NEW.club_id;

    INSERT INTO notifications (user_id, club_id, type, message, read, data)
    VALUES (
      NEW.user_id,
      NEW.club_id,
      'request_accepted',
      'You''ve been added to ' || club_name || '.',
      false,
      jsonb_build_object(
        'clubId', NEW.club_id,
        'clubName', club_name,
        'clubLogo', club_logo
      )
    );
  END IF;

  RETURN NEW;
END;
$function$
