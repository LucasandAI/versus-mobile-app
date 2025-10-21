
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export const useDirectMessageUnreadState = (currentUserId: string | undefined) => {
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [dmUnreadCount, setDmUnreadCount] = useState(0);
  const [unreadMessagesPerConversation, setUnreadMessagesPerConversation] = useState<Record<string, number>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});

  // Mark conversation as unread (for new incoming messages)
  const markConversationAsUnread = useCallback((conversationId: string) => {
    // Validate the conversationId
    if (!conversationId || typeof conversationId !== 'string' || !conversationId.trim()) {
      console.error(`[useDirectMessageUnreadState] Invalid conversationId: ${conversationId}, cannot mark as unread`);
      return;
    }
    
    setUnreadConversations(prev => {
      const updated = new Set(prev);
      const normalizedId = conversationId.toString(); // Ensure consistency
      
      if (!updated.has(normalizedId)) {
        updated.add(normalizedId);
        
        // Update unread messages per conversation
        setUnreadMessagesPerConversation(prev => {
          const updated = { ...prev };
          updated[normalizedId] = (updated[normalizedId] || 0) + 1;
          return updated;
        });
        
        setDmUnreadCount(prev => prev + 1);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      } else {
        // If conversation is already marked as unread, just increment the message count
        setUnreadMessagesPerConversation(prev => {
          const updated = { ...prev };
          updated[normalizedId] = (updated[normalizedId] || 0) + 1;
          return updated;
        });
        
        setDmUnreadCount(prev => prev + 1);
      }
      return updated;
    });
  }, []);

  // Mark conversation as read
  const markConversationAsRead = useCallback(async (conversationId: string) => {
    // Validate inputs
    if (!currentUserId || !conversationId || typeof conversationId !== 'string' || !conversationId.trim()) {
      console.error(`[useDirectMessageUnreadState] Invalid parameters - userId: ${currentUserId}, conversationId: ${conversationId}`);
      return;
    }
    
    // Check if there's already a pending update for this conversation
    if (pendingUpdates[conversationId]) {
      console.log(`[useDirectMessageUnreadState] Update for conversation ${conversationId} already in progress, skipping`);
      return;
    }
    
    // Set this update as pending
    setPendingUpdates(prev => ({ ...prev, [conversationId]: true }));
    
    // Get the number of unread messages for this conversation
    const messageCount = unreadMessagesPerConversation[conversationId] || 0;
    
    // Optimistically update local state
    setUnreadConversations(prev => {
      if (!prev.has(conversationId)) {
        console.log(`[useDirectMessageUnreadState] Conversation ${conversationId} not in unread set`);
        return prev;
      }
      
      const updated = new Set(prev);
      updated.delete(conversationId);
      
      // Subtract the actual count of unread messages for this conversation
      setDmUnreadCount(prevCount => Math.max(0, prevCount - messageCount));
      
      // Clear the unread messages count for this conversation
      setUnreadMessagesPerConversation(prev => {
        const updated = { ...prev };
        delete updated[conversationId];
        return updated;
      });
      
      // Dispatch event to notify UI components
      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      
      return updated;
    });
    
    // Track retries for better error handling
    let retries = 0;
    const maxRetries = 3;
    let success = false;
    
    while (retries < maxRetries && !success) {
      try {
        console.log(`[useDirectMessageUnreadState] Marking conversation ${conversationId} as read using RPC (attempt ${retries + 1})`);
        
        // Use the RPC function to mark the conversation as read
        const { error } = await supabase.rpc(
          'mark_conversation_as_read', 
          { 
            p_conversation_id: conversationId,
            p_user_id: currentUserId
          }
        );
        
        if (error) {
          console.error(`[useDirectMessageUnreadState] Error updating direct message read status (attempt ${retries + 1}):`, error);
          throw error;
        }
        
        // If we got here, the update was successful
        success = true;
        
        // Dispatch event to notify other components of success
        window.dispatchEvent(new CustomEvent('dm-read-status-updated', { 
          detail: { conversationId } 
        }));
        
      } catch (error) {
        retries++;
        
        if (retries < maxRetries) {
          // Wait before retrying with exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
        } else {
          console.error('[useDirectMessageUnreadState] Error marking conversation as read after all retries:', error);
          
          // Revert optimistic update on error
          setUnreadConversations(prev => {
            const reverted = new Set(prev);
            reverted.add(conversationId);
            return reverted;
          });
          
          // Restore the unread message count on error
          setUnreadMessagesPerConversation(prev => ({
            ...prev,
            [conversationId]: messageCount
          }));
          
          setDmUnreadCount(prev => prev + messageCount);
          
          // Notify UI components about the revert
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
          
          // Only show toast error after all retries
          toast.error("Failed to mark conversation as read", {
            id: `dm-read-error-${conversationId}`,
            duration: 3000
          });
        }
      } finally {
        // Always clear the pending status
        setPendingUpdates(prev => {
          const updated = { ...prev };
          delete updated[conversationId];
          return updated;
        });
      }
    }
  }, [currentUserId, unreadMessagesPerConversation, pendingUpdates]);

  return {
    unreadConversations,
    setUnreadConversations,
    dmUnreadCount,
    setDmUnreadCount,
    unreadMessagesPerConversation,
    setUnreadMessagesPerConversation,
    markConversationAsUnread,
    markConversationAsRead
  };
};
