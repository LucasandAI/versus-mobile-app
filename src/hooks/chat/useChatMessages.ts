
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useChatMessages = (
  currentUser: any
) => {
  const handleSendMessage = useCallback(async (message: string, clubId: string) => {
    if (!message.trim() || !clubId) return;

    try {
      // Get the current auth session directly
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) {
        console.error('Cannot send message: No authenticated user found');
        return;
      }
      
      const authUserId = sessionData.session.user.id;
      
      // Send to Supabase
      const { error } = await supabase
        .from('club_chat_messages')
        .insert({
          message: message,
          sender_id: authUserId,
          club_id: clubId
        });
        
      if (error) {
        console.error('Error sending club message:', error);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
    }
  }, [currentUser]);

  return {
    handleSendMessage
  };
};
