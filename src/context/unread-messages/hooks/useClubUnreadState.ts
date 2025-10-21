
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

export const useClubUnreadState = (currentUserId: string | undefined) => {
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  const [clubUnreadCount, setClubUnreadCount] = useState(0);
  const [unreadMessagesPerClub, setUnreadMessagesPerClub] = useState<Record<string, number>>({});
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, boolean>>({});
  
  // Mark club as unread (for new incoming messages)
  const markClubAsUnread = useCallback((clubId: string) => {
    if (!clubId || typeof clubId !== 'string' || !clubId.trim()) {
      console.error(`[useClubUnreadState] Invalid clubId: ${clubId}, cannot mark as unread`);
      return;
    }
    
    console.log(`[useClubUnreadState] Marking club ${clubId} as unread`);
    
    setUnreadClubs(prev => {
      const updated = new Set(prev);
      const normalizedClubId = clubId.toString(); // Convert to string to ensure consistency
      
      if (!updated.has(normalizedClubId)) {
        updated.add(normalizedClubId);
        console.log(`[useClubUnreadState] Club ${normalizedClubId} added to unread set:`, Array.from(updated));
        
        // Update the unread messages count for this club
        setUnreadMessagesPerClub(prev => {
          const updated = { ...prev };
          updated[normalizedClubId] = (updated[normalizedClubId] || 0) + 1;
          return updated;
        });
        
        setClubUnreadCount(prev => prev + 1);
        
        // Dispatch event to notify UI components
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      } else {
        console.log(`[useClubUnreadState] Club ${normalizedClubId} was already in unread set`);
        
        // If club is already marked as unread, just increment the message count
        setUnreadMessagesPerClub(prev => {
          const updated = { ...prev };
          updated[normalizedClubId] = (updated[normalizedClubId] || 0) + 1;
          return updated;
        });
        
        setClubUnreadCount(prev => prev + 1);
      }
      return updated;
    });
  }, []);

  // Mark club messages as read
  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    // Validate inputs
    if (!currentUserId || !clubId || typeof clubId !== 'string' || !clubId.trim()) {
      console.error(`[useClubUnreadState] Invalid parameters - userId: ${currentUserId}, clubId: ${clubId}`);
      return;
    }
    
    // Check if there's already a pending update for this club
    if (pendingUpdates[clubId]) {
      console.log(`[useClubUnreadState] Update for club ${clubId} already in progress, skipping`);
      return;
    }
    
    console.log(`[useClubUnreadState] Marking club ${clubId} messages as read`);
    
    // Set this update as pending
    setPendingUpdates(prev => ({ ...prev, [clubId]: true }));
    
    // Get the number of unread messages for this club
    const messageCount = unreadMessagesPerClub[clubId] || 0;
    
    // Optimistically update local state
    setUnreadClubs(prev => {
      if (!prev.has(clubId)) {
        console.log(`[useClubUnreadState] Club ${clubId} not in unread set:`, Array.from(prev));
        return prev;
      }
      
      const updated = new Set(prev);
      updated.delete(clubId);
      console.log(`[useClubUnreadState] Club ${clubId} removed from unread set:`, Array.from(updated));
      
      // Subtract the actual count of unread messages for this club
      setClubUnreadCount(prevCount => Math.max(0, prevCount - messageCount));
      
      // Clear the unread messages count for this club
      setUnreadMessagesPerClub(prev => {
        const updated = { ...prev };
        delete updated[clubId];
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
        // Use the RPC function to mark the club as read
        const normalizedClubId = clubId.toString(); // Ensure it's a string
        console.log(`[useClubUnreadState] Marking club ${normalizedClubId} as read using RPC (attempt ${retries + 1})`);
        
        const { error } = await supabase.rpc(
          'mark_club_as_read', 
          { 
            p_club_id: normalizedClubId,
            p_user_id: currentUserId
          }
        );
        
        if (error) {
          console.error(`[useClubUnreadState] Error marking club as read (attempt ${retries + 1}):`, error);
          throw error;
        }
        
        // If we got here, the update was successful
        success = true;
        
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('clubMessagesRead', { 
          detail: { clubId } 
        }));
        
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        } else {
          console.error('[useClubUnreadState] Error marking club messages as read after all retries:', error);
          
          // Revert optimistic update on error
          setUnreadClubs(prev => {
            const reverted = new Set(prev);
            reverted.add(clubId);
            return reverted;
          });
          
          // Restore the unread message count on error
          setUnreadMessagesPerClub(prev => ({
            ...prev,
            [clubId]: messageCount
          }));
          
          setClubUnreadCount(prev => prev + messageCount);
          
          // Notify UI components about the revert
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
          
          // Only show toast error after all retries
          toast.error("Failed to mark club messages as read", {
            id: `club-read-error-${clubId}`,
            duration: 3000
          });
        }
      } finally {
        // Always clear the pending status
        setPendingUpdates(prev => {
          const updated = { ...prev };
          delete updated[clubId];
          return updated;
        });
      }
    }
  }, [currentUserId, unreadMessagesPerClub, pendingUpdates]);

  return {
    unreadClubs,
    setUnreadClubs,
    clubUnreadCount,
    setClubUnreadCount,
    unreadMessagesPerClub,
    setUnreadMessagesPerClub,
    markClubAsUnread,
    markClubMessagesAsRead
  };
};
