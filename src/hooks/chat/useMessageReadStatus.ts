import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadMessages } from '@/context/unread-messages';
import { markClubReadLocally, markDmReadLocally } from '@/utils/chat/readStatusStorage';
import { debounce, flushDebounce, forceFlushDebounce } from '@/utils/chat/debounceUtils';
import { setActiveConversation, refreshActiveTimestamp } from '@/utils/chat/activeConversationTracker';

// Constants for debounce delays
const READ_STATUS_DEBOUNCE_DELAY = 300; // Reduced from 1000ms to 300ms for faster updates
const MAX_RETRIES = 3; 
const RETRY_DELAYS = [1000, 3000, 5000]; // 1s, 3s, 5s

// Helper to retry operations with exponential backoff
const retryOperation = async (
  operation: () => Promise<any>,
  retries = MAX_RETRIES,
  delayIndex = 0
): Promise<any> => {
  try {
    return await operation();
  } catch (error) {
    if (retries <= 0) throw error;
    
    // Wait for the specified delay
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[delayIndex] || 5000));
    
    // Retry with one less retry and next delay
    return retryOperation(operation, retries - 1, Math.min(delayIndex + 1, RETRY_DELAYS.length - 1));
  }
};

export const useMessageReadStatus = () => {
  const { markDirectConversationAsRead, markClubMessagesAsRead } = useUnreadMessages();

  // Debounced database update function for DMs
  const debouncedMarkDmReadInDb = useCallback(
    debounce('mark-dm-read', async (conversationId: string) => {
      // Early validation
      if (!conversationId || typeof conversationId !== 'string' || !conversationId.trim()) {
        console.error('[useMessageReadStatus] Invalid DM conversation ID, skipping DB update');
        return;
      }
      
      try {
        console.log(`[useMessageReadStatus] Updating DB read status for DM ${conversationId}`);
        
        // Get the current user ID immediately for better stability
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        if (!userId) {
          console.error('[useMessageReadStatus] No user ID available, cannot update read status');
          return;
        }
        
        await retryOperation(async () => {
          // Use the RPC function to mark the conversation as read
          const { error } = await supabase.rpc(
            'mark_conversation_as_read', 
            { 
              p_conversation_id: conversationId,
              p_user_id: userId
            }
          );

          if (error) {
            console.error('[useMessageReadStatus] Error updating DM read status in DB:', error);
            throw error;
          }
        });
        
        // Only dispatch success event if we made it here (no errors thrown)
        window.dispatchEvent(new CustomEvent('dm-read-status-updated', { 
          detail: { conversationId } 
        }));
      } catch (error) {
        console.error('[useMessageReadStatus] Error in debouncedMarkDmReadInDb after retries:', error);
        // Notify UI of error
        window.dispatchEvent(new CustomEvent('read-status-error', { 
          detail: { type: 'dm', id: conversationId, error } 
        }));
      }
    }, READ_STATUS_DEBOUNCE_DELAY),
    []
  );

  // Debounced database update function for club messages
  const debouncedMarkClubReadInDb = useCallback(
    debounce('mark-club-read', async (clubId: string) => {
      // Early validation
      if (!clubId || typeof clubId !== 'string' || !clubId.trim()) {
        console.error('[useMessageReadStatus] Invalid club ID, skipping DB update');
        return;
      }
      
      try {
        console.log(`[useMessageReadStatus] Updating DB read status for club ${clubId}`);
        
        // Get the current user ID immediately for better stability
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        if (!userId) {
          console.error('[useMessageReadStatus] No user ID available, cannot update club read status');
          return;
        }
        
        await retryOperation(async () => {
          // Use the RPC function to mark the club as read
          const { error } = await supabase.rpc(
            'mark_club_as_read', 
            { 
              p_club_id: clubId,
              p_user_id: userId
            }
          );

          if (error) {
            console.error('[useMessageReadStatus] Error updating club read status in DB:', error);
            throw error;
          }
        });
        
        // Only dispatch success event if we made it here (no errors thrown)
        window.dispatchEvent(new CustomEvent('club-read-status-updated', {
          detail: { clubId }
        }));
      } catch (error) {
        console.error('[useMessageReadStatus] Error in debouncedMarkClubReadInDb after retries:', error);
        // Notify UI of error
        window.dispatchEvent(new CustomEvent('read-status-error', { 
          detail: { type: 'club', id: clubId, error } 
        }));
      }
    }, READ_STATUS_DEBOUNCE_DELAY),
    []
  );

  // Debounced database update function for individual messages
  const debouncedMarkMessageReadInDb = useCallback(
    debounce('mark-message-read', async (messageId: string, messageType: 'dm' | 'club') => {
      // Early validation
      if (!messageId || typeof messageId !== 'string' || !messageId.trim()) {
        console.error('[useMessageReadStatus] Invalid message ID, skipping DB update');
        return;
      }
      
      try {
        console.log(`[useMessageReadStatus] Marking individual message as read: ${messageId} (${messageType})`);
        
        // Get the current user ID immediately for better stability
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        
        if (!userId) {
          console.error('[useMessageReadStatus] No user ID available, cannot update message read status');
          return;
        }
        
        await retryOperation(async () => {
          // Use the RPC function to mark the specific message as read
          const { error } = await supabase.rpc(
            'mark_message_as_read', 
            { 
              p_message_id: messageId,
              p_user_id: userId,
              p_message_type: messageType
            }
          );

          if (error) {
            console.error('[useMessageReadStatus] Error updating message read status in DB:', error);
            throw error;
          }
        });
      } catch (error) {
        console.error('[useMessageReadStatus] Error marking message as read:', error);
      }
    }, 200), // Reduced from 500ms to 200ms for faster updates
    []
  );

  // Mark direct messages as read with local-first approach
  const markDirectMessagesAsRead = useCallback(
    async (conversationId: string, immediate: boolean = false) => {
      try {
        // Validate ID
        if (!conversationId || typeof conversationId !== 'string' || !conversationId.trim()) {
          console.error(`[useMessageReadStatus] Invalid DM conversation ID: ${conversationId}`);
          return;
        }
        
        console.log(`[useMessageReadStatus] Marking DM ${conversationId} as read${immediate ? ' (immediate)' : ''}`);
        
        // 1. Mark the conversation as active to prevent incoming messages from being marked as unread
        // Do this FIRST, before any other operations
        setActiveConversation('dm', conversationId);
        
        // 2. Update local storage immediately for instant UI feedback
        const localUpdateSuccess = markDmReadLocally(conversationId);
        
        if (!localUpdateSuccess) {
          console.error(`[useMessageReadStatus] Failed to update local storage for DM ${conversationId}`);
        }

        // 3. Use the context method for optimistic updates to any UI components
        try {
          await markDirectConversationAsRead(conversationId);
        } catch (error) {
          console.error('[useMessageReadStatus] Error in context method for DM read status:', error);
        }

        // 4. Trigger an immediate UI refresh using requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('unread-status-changed', {
            detail: { type: 'dm', id: conversationId }
          }));
        });

        // 5. Schedule a debounced update to the database or do it immediately
        if (immediate) {
          forceFlushDebounce('mark-dm-read');
          await debouncedMarkDmReadInDb(conversationId);
        } else {
          debouncedMarkDmReadInDb(conversationId);
        }
        
        // 6. Force a periodic refresh of active status to handle race conditions
        const intervalId = setInterval(() => {
          refreshActiveTimestamp('dm', conversationId);
        }, 5000);
        
        // Clear interval after a minute
        setTimeout(() => clearInterval(intervalId), 60000);
      } catch (error) {
        console.error('[useMessageReadStatus] Error marking DM as read:', error);
      }
    },
    [markDirectConversationAsRead, debouncedMarkDmReadInDb]
  );

  // Mark club messages as read with local-first approach
  const markClubMessagesAsReadNew = useCallback(
    async (clubId: string, immediate: boolean = false) => {
      try {
        // Validate ID
        if (!clubId || typeof clubId !== 'string' || !clubId.trim()) {
          console.error(`[useMessageReadStatus] Invalid club ID: ${clubId}`);
          return;
        }
        
        console.log(`[useMessageReadStatus] Marking club ${clubId} as read${immediate ? ' (immediate)' : ''}`);
        
        // 1. Mark the club conversation as active FIRST
        setActiveConversation('club', clubId);

        // 2. Update local storage immediately for instant UI feedback
        const localUpdateSuccess = markClubReadLocally(clubId);
        
        if (!localUpdateSuccess) {
          console.error(`[useMessageReadStatus] Failed to update local storage for club ${clubId}`);
        }

        // 3. Use the context method for optimistic updates to any UI components
        try {
          await markClubMessagesAsRead(clubId);
        } catch (error) {
          console.error('[useMessageReadStatus] Error in context method for club read status:', error);
        }

        // 4. Trigger an immediate UI refresh using requestAnimationFrame for smoother updates
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('unread-status-changed', {
            detail: { type: 'club', id: clubId }
          }));
        });

        // 5. Schedule a debounced update to the database or do it immediately
        if (immediate) {
          forceFlushDebounce('mark-club-read');
          await debouncedMarkClubReadInDb(clubId);
        } else {
          debouncedMarkClubReadInDb(clubId);
        }
        
        // 6. Force a periodic refresh of active status to handle race conditions
        const intervalId = setInterval(() => {
          refreshActiveTimestamp('club', clubId);
        }, 5000);
        
        // Clear interval after a minute
        setTimeout(() => clearInterval(intervalId), 60000);
      } catch (error) {
        console.error('[useMessageReadStatus] Error marking club messages as read:', error);
      }
    },
    [markClubMessagesAsRead, debouncedMarkClubReadInDb]
  );

  // Mark a specific message as read
  const markMessageAsRead = useCallback(
    (messageId: string, messageType: 'dm' | 'club') => {
      if (!messageId) return;
      debouncedMarkMessageReadInDb(messageId, messageType);
    },
    [debouncedMarkMessageReadInDb]
  );

  return {
    markDirectMessagesAsRead,
    markClubMessagesAsRead: markClubMessagesAsReadNew,
    markMessageAsRead,
    flushReadStatus: () => {
      forceFlushDebounce('mark-dm-read');
      forceFlushDebounce('mark-club-read');
      forceFlushDebounce('mark-message-read');
    }
  };
};
