
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useRealtimeMessages = (open: boolean, setLocalClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
  useEffect(() => {
    if (!open) return;

    console.log('[useRealtimeMessages] Setting up real-time message subscriptions');
    
    // Channel for message deletions
    const messageDeleteChannel = supabase.channel('club-message-deletions');
    messageDeleteChannel
      .on('postgres_changes', 
          { event: 'DELETE', schema: 'public', table: 'club_chat_messages' },
          (payload) => {
            console.log('[useRealtimeMessages] Message deletion event received:', payload);
            
            if (payload.old && payload.old.id && payload.old.club_id) {
              const deletedMessageId = payload.old.id;
              const clubId = payload.old.club_id;
              
              setLocalClubMessages(prev => {
                if (!prev[clubId]) return prev;
                
                const updatedClubMessages = prev[clubId].filter(msg => {
                  const msgId = typeof msg.id === 'string' ? msg.id : 
                              (msg.id ? String(msg.id) : null);
                  const deleteId = typeof deletedMessageId === 'string' ? deletedMessageId : 
                                  String(deletedMessageId);
                  
                  return msgId !== deleteId;
                });
                
                return {
                  ...prev,
                  [clubId]: updatedClubMessages
                };
              });
            }
          })
      .subscribe();
    
    // Channel for message insertions
    const messageInsertChannel = supabase.channel('club-message-insertions');
    messageInsertChannel
      .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'club_chat_messages' },
          (payload) => {
            console.log('[useRealtimeMessages] Message insert event received:', payload);
            
            if (payload.new && payload.new.id && payload.new.club_id) {
              const newMessageId = payload.new.id;
              const clubId = payload.new.club_id;
              
              setLocalClubMessages(prev => {
                const clubMessages = prev[clubId] || [];
                
                // Check if message already exists in the array
                if (clubMessages.some(msg => String(msg.id) === String(newMessageId))) {
                  return prev;
                }
                
                return {
                  ...prev,
                  [clubId]: [...clubMessages, payload.new]
                };
              });
            }
          })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messageDeleteChannel);
      supabase.removeChannel(messageInsertChannel);
    };
  }, [open, setLocalClubMessages]);
};

export default useRealtimeMessages;
