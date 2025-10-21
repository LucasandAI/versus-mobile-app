
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import UnreadMessagesContext from './UnreadMessagesContext';
import { useApp } from '@/context/app/AppContext';
import { useClubUnreadState } from './hooks/useClubUnreadState';
import { useDirectMessageUnreadState } from './hooks/useDirectMessageUnreadState';
import { useFetchUnreadCounts } from './hooks/useFetchUnreadCounts';
import { isConversationActive } from '@/utils/chat/activeConversationTracker';
import { incrementConversationBadge } from '@/utils/chat/unifiedBadgeManager';

export const UnreadMessagesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, isSessionReady } = useApp();
  const [clubUnreadCounts, setClubUnreadCounts] = useState<Record<string, number>>({});
  const [directMessageUnreadCounts, setDirectMessageUnreadCounts] = useState<Record<string, number>>({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  
  // Use our dedicated hooks for managing unread state
  const {
    unreadClubs,
    setUnreadClubs,
    clubUnreadCount,
    setClubUnreadCount,
    unreadMessagesPerClub,
    setUnreadMessagesPerClub,
    markClubAsUnread,
    markClubMessagesAsRead
  } = useClubUnreadState(currentUser?.id);
  
  const {
    unreadConversations,
    setUnreadConversations,
    dmUnreadCount,
    setDmUnreadCount,
    unreadMessagesPerConversation,
    setUnreadMessagesPerConversation,
    markConversationAsUnread,
    markConversationAsRead
  } = useDirectMessageUnreadState(currentUser?.id);
  
  // Hook for fetching unread counts from the database
  const { fetchUnreadCounts } = useFetchUnreadCounts({
    currentUserId: currentUser?.id,
    isSessionReady,
    setDmUnreadCount,
    setClubUnreadCount,
    setUnreadConversations,
    setUnreadClubs,
    setUnreadMessagesPerConversation,
    setUnreadMessagesPerClub
  });
  
  // Enhanced function to handle club messages - only mark as unread if conversation is not active
  const handleNewClubMessage = useCallback((clubId: string, messageTimestamp?: number) => {
    // Only mark as unread if this club conversation is NOT currently active
    if (!isConversationActive('club', clubId)) {
      console.log(`[UnreadMessagesProvider] Marking club ${clubId} as unread (not active)`);
      markClubAsUnread(clubId);
      incrementConversationBadge(clubId);
    } else {
      console.log(`[UnreadMessagesProvider] Club ${clubId} is active, not marking as unread`);
    }
  }, [markClubAsUnread]);
  
  // Enhanced function to handle DM messages - only mark as unread if conversation is not active  
  const handleNewDirectMessage = useCallback((conversationId: string, messageTimestamp?: number) => {
    // Only mark as unread if this DM conversation is NOT currently active
    if (!isConversationActive('dm', conversationId)) {
      console.log(`[UnreadMessagesProvider] Marking DM ${conversationId} as unread (not active)`);
      markConversationAsUnread(conversationId);
      incrementConversationBadge(conversationId);
    } else {
      console.log(`[UnreadMessagesProvider] DM ${conversationId} is active, not marking as unread`);
    }
  }, [markConversationAsUnread]);
  
  // Set up real-time subscriptions for unread messages
  useEffect(() => {
    if (!isSessionReady || !currentUser?.id) return;

    console.log('[UnreadMessagesProvider] Setting up real-time subscriptions');

    // DM subscription
    const dmChannel = supabase.channel('dm-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        console.log('[UnreadMessagesProvider] New DM received:', payload);
        
        if (payload.new.receiver_id === currentUser.id) {
          const conversationId = payload.new.conversation_id;
          const messageTimestamp = new Date(payload.new.timestamp).getTime();
          
          // Handle new message with conversation-specific logic
          handleNewDirectMessage(conversationId, messageTimestamp);
        }
      })
      .subscribe();

    // Club message subscription  
    const clubChannel = supabase.channel('club-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'club_chat_messages'
      }, (payload) => {
        console.log('[UnreadMessagesProvider] New club message received:', payload);
        
        if (payload.new.sender_id !== currentUser.id) {
          const clubId = payload.new.club_id;
          const messageTimestamp = new Date(payload.new.timestamp).getTime();
          
          // Handle new message with conversation-specific logic
          handleNewClubMessage(clubId, messageTimestamp);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
    };
  }, [currentUser?.id, isSessionReady, handleNewDirectMessage, handleNewClubMessage]);
  
  // Update total count whenever individual counts change
  useEffect(() => {
    setTotalUnreadCount(clubUnreadCount + dmUnreadCount);
  }, [clubUnreadCount, dmUnreadCount]);
  
  // Refresh unread counts periodically to stay in sync with the server
  useEffect(() => {
    if (!currentUser?.id || !isSessionReady) return;
    
    // Fetch once on mount
    fetchUnreadCounts();
    
    // Set up periodic refresh (every 5 minutes)
    const intervalId = setInterval(() => {
      fetchUnreadCounts();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [currentUser?.id, isSessionReady, fetchUnreadCounts]);
  
  // Legacy method for compatibility
  const refreshUnreadCounts = useCallback(async () => {
    await fetchUnreadCounts();
  }, [fetchUnreadCounts]);
  
  // Build the context value with all required properties
  const contextValue = {
    totalUnreadCount,
    clubUnreadCounts,
    directMessageUnreadCounts,
    refreshUnreadCounts,
    
    unreadConversations,
    unreadClubs,
    markClubMessagesAsRead,
    markConversationAsRead,
    fetchUnreadCounts,
    
    // Properties from original interface
    unreadClubMessages: unreadClubs,
    unreadDirectMessageConversations: unreadConversations,
    markDirectConversationAsRead: markConversationAsRead,
    unreadMessagesCount: totalUnreadCount
  };

  return (
    <UnreadMessagesContext.Provider value={contextValue}>
      {children}
    </UnreadMessagesContext.Provider>
  );
};
