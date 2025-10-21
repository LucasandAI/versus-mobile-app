
-- Create RPC function to mark all messages in a conversation as read
CREATE OR REPLACE FUNCTION public.mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE direct_messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE 
    conversation_id = p_conversation_id
    AND NOT (p_user_id = ANY(read_by));
END;
$$;

-- Create RPC function to mark all messages in a club as read
CREATE OR REPLACE FUNCTION public.mark_club_as_read(
  p_club_id UUID,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE club_chat_messages
  SET read_by = array_append(read_by, p_user_id)
  WHERE 
    club_id = p_club_id
    AND NOT (p_user_id = ANY(read_by));
END;
$$;
