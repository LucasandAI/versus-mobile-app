
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';

// This hook is now focused only on updating unread counts and firing events
// The actual message display is handled by useClubMessages
export const useRealtimeChat = (
  currentUserId: string | undefined,
  userClubs: Club[]
) => {
  useEffect(() => {
    if (!currentUserId || userClubs.length === 0) {
      console.log('[useRealtimeChat] No current user ID or clubs, not setting up subscription');
      return;
    }
    
    const clubIds = userClubs.map(club => club.id);
    console.log('[useRealtimeChat] Setting up global subscription for unread notifications');
    
    // Subscribe only for unread notifications, not for displaying messages
    const channel = supabase
      .channel('chat-notifications')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages',
          filter: clubIds.length > 0 ? `club_id=in.(${clubIds.map(id => `'${id}'`).join(',')})` : undefined
        },
        (payload) => {
          console.log('[useRealtimeChat] New message notification:', payload.new.id);
          
          if (payload.new.sender_id !== currentUserId) {
            // Update unread count if the message is not from current user
            const clubId = payload.new.club_id;
            console.log('[useRealtimeChat] Dispatching unread message event for club:', clubId);
            
            // Dispatch event to update unread messages
            const event = new CustomEvent('unreadMessagesUpdated', { 
              detail: { clubId }
            });
            window.dispatchEvent(event);
          }
        }
      )
      .subscribe((status) => {
        console.log('[useRealtimeChat] Subscription status:', status);
      });

    return () => {
      console.log('[useRealtimeChat] Cleaning up global subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUserId, userClubs]);
};
