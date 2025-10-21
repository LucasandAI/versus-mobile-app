
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserCache } from './types';

export const useRealtimeSubscriptions = (
  currentUserId: string | undefined,
  userCache: UserCache,
  fetchUserData: (userId: string) => Promise<any>,
  updateConversation: (conversationId: string, userId: string, newMessage: string, otherUserName: string, otherUserAvatar: string) => void
) => {
  useEffect(() => {
    if (!currentUserId) return;

    console.log('[useConversations] Setting up real-time subscriptions for user:', currentUserId);
    
    // Listen for new direct messages
    const messagesChannel = supabase
      .channel('direct-messages-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages'
        },
        async (payload: any) => {
          if (!payload.new) return;
          
          // Skip messages sent by the current user
          if (payload.new.sender_id === currentUserId) return;
          
          // Only handle messages where this user is involved
          if (payload.new.sender_id !== currentUserId && payload.new.receiver_id !== currentUserId) return;
          
          console.log('[RealTime] DM detected:', payload, 'timestamp:', new Date().toISOString());
          
          // For incoming messages from another user
          const otherUserId = payload.new.sender_id;
          const cachedUser = userCache[otherUserId];
          
          if (cachedUser) {
            updateConversation(
              payload.new.conversation_id, 
              otherUserId, 
              payload.new.text, 
              cachedUser.name, 
              cachedUser.avatar || '/placeholder.svg'
            );
          } else {
            const userData = await fetchUserData(otherUserId);
            if (userData) {
              updateConversation(
                payload.new.conversation_id, 
                otherUserId, 
                payload.new.text, 
                userData.name, 
                userData.avatar || '/placeholder.svg'
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('[useConversations] Cleaning up real-time subscriptions');
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUserId, updateConversation, fetchUserData, userCache]);
};
