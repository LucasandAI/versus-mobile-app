
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  getTotalBadgeCount,
  getConversationBadgeCount,
  setConversationBadgeCount,
  incrementConversationBadge,
  resetConversationBadge,
  initializeConversationBadges
} from '@/utils/chat/unifiedBadgeManager';

/**
 * Hook for managing chat badge count with unified badge system
 */
export const useChatBadge = (userId?: string) => {
  const [badgeCount, setBadgeCountState] = useState<number>(getTotalBadgeCount());
  
  // Initialize badges from database on mount
  useEffect(() => {
    if (!userId) return;
    
    const initializeBadges = async () => {
      try {
        console.log('[useChatBadge] Initializing badges from database');
        
        const conversationCounts: Record<string, number> = {};
        
        // Get DM unread counts
        const { data: conversations } = await supabase
          .from('direct_conversations')
          .select('id')
          .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);
        
        if (conversations) {
          for (const conv of conversations) {
            const { data: unreadMessages } = await supabase
              .from('direct_messages')
              .select('id')
              .eq('conversation_id', conv.id)
              .contains('unread_by', [userId]);
            
            if (unreadMessages && unreadMessages.length > 0) {
              conversationCounts[conv.id] = unreadMessages.length;
            }
          }
        }
        
        // Get club unread counts
        const { data: userClubs } = await supabase
          .from('club_members')
          .select('club_id')
          .eq('user_id', userId);
        
        if (userClubs) {
          for (const membership of userClubs) {
            const { data: unreadMessages } = await supabase
              .from('club_chat_messages')
              .select('id')
              .eq('club_id', membership.club_id)
              .contains('unread_by', [userId]);
            
            if (unreadMessages && unreadMessages.length > 0) {
              conversationCounts[membership.club_id] = unreadMessages.length;
            }
          }
        }
        
        // Initialize the unified badge system
        initializeConversationBadges(conversationCounts);
        setBadgeCountState(getTotalBadgeCount());
        
        console.log(`[useChatBadge] Initialized with total count: ${getTotalBadgeCount()}`);
      } catch (error) {
        console.error('[useChatBadge] Error initializing badges:', error);
      }
    };
    
    initializeBadges();
  }, [userId]);
  
  // Listen for unified badge updates
  useEffect(() => {
    const handleBadgeUpdate = (event: CustomEvent) => {
      const { totalCount } = event.detail;
      setBadgeCountState(totalCount);
      console.log(`[useChatBadge] Badge count updated to: ${totalCount}`);
    };
    
    window.addEventListener('unified-badge-update', handleBadgeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('unified-badge-update', handleBadgeUpdate as EventListener);
    };
  }, []);
  
  return {
    badgeCount,
    refreshBadge: () => setBadgeCountState(getTotalBadgeCount()),
    // Conversation-specific methods
    getConversationBadgeCount,
    setConversationBadgeCount,
    incrementConversationBadge,
    resetConversationBadge
  };
};
