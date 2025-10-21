
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Club } from '@/types';
import { useClubLastMessages } from './useClubLastMessages';
import { ClubConversation } from './useClubConversations';

// Make this interface match ClubConversation from useClubConversations.ts
export const useClubConversationList = (clubs: Club[]): { conversations: ClubConversation[], isLoading: boolean } => {
  const { lastMessages, isLoading, senderCache } = useClubLastMessages(clubs);
  const [updateKey, setUpdateKey] = useState(Date.now());
  
  // Create a handler for global update events
  const handleMessagesUpdated = useCallback(() => {
    console.log('[useClubConversationList] Message update detected, refreshing list');
    setUpdateKey(Date.now());
  }, []);
  
  // Listen for club messages updated events
  useEffect(() => {
    window.addEventListener('clubMessagesUpdated', handleMessagesUpdated);
    return () => {
      window.removeEventListener('clubMessagesUpdated', handleMessagesUpdated);
    };
  }, [handleMessagesUpdated]);
  
  // Use useMemo for synchronous sorting instead of useEffect to prevent flash
  const clubConversationList = useMemo(() => {
    // Map clubs to their conversations with last messages
    const conversationList = clubs.map(club => {
      const lastMessage = lastMessages[club.id];
      
      return {
        club,
        lastMessage: lastMessage ? {
          message: lastMessage.message,
          sender_id: lastMessage.sender_id,
          sender: lastMessage.sender,
          sender_username: lastMessage.sender?.name || 
                          (senderCache[lastMessage.sender_id]?.name || 'Unknown'),
          timestamp: lastMessage.timestamp
        } : null
      };
    });
    
    // Sort conversation list by timestamp (newest first) to ensure that
    // new messages appear at the top - done synchronously to prevent flash
    const sortedConversations = [...conversationList].sort((a, b) => {
      const timeA = a.lastMessage?.timestamp ? new Date(a.lastMessage.timestamp).getTime() : 0;
      const timeB = b.lastMessage?.timestamp ? new Date(b.lastMessage.timestamp).getTime() : 0;
      return timeB - timeA; // Descending order (newest first)
    });
    
    console.log('[useClubConversationList] Synchronously sorted conversation list with', sortedConversations.length, 'conversations');
    return sortedConversations;
  }, [clubs, lastMessages, senderCache, updateKey]);
  
  return {
    conversations: clubConversationList,
    isLoading
  };
};
