
import { useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { ChatStateData } from '@/types/chat-state';

// Define local storage keys
const MESSAGES_KEY = 'chatMessages';
const UNREAD_MESSAGES_KEY = 'unreadMessages';
const ACTIVE_CLUB_KEY = 'activeClub';
const READ_TIMESTAMPS_KEY = 'readTimestamps';

export const useLocalStorage = () => {
  const loadFromStorage = useCallback(() => {
    const savedMessages = localStorage.getItem(MESSAGES_KEY);
    const savedUnread = localStorage.getItem(UNREAD_MESSAGES_KEY);
    const savedReadTimestamps = localStorage.getItem(READ_TIMESTAMPS_KEY);
    
    const messages = savedMessages ? JSON.parse(savedMessages) : {};
    const unreadMessages = savedUnread ? JSON.parse(savedUnread) : {};
    const readTimestamps = savedReadTimestamps ? JSON.parse(savedReadTimestamps) : {
      clubs: {},
      dms: {}
    };
    
    return {
      messages,
      unreadMessages,
      readTimestamps
    };
  }, []);

  const saveMessages = useCallback((messages: Record<string, ChatMessage[]>) => {
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  }, []);

  const saveUnreadMessages = useCallback((unreadMessages: Record<string, number>) => {
    localStorage.setItem(UNREAD_MESSAGES_KEY, JSON.stringify(unreadMessages));
    const event = new CustomEvent('unreadMessagesUpdated');
    window.dispatchEvent(event);
  }, []);

  const saveReadTimestamps = useCallback((timestamps: { clubs: Record<string, number>, dms: Record<string, number> }) => {
    localStorage.setItem(READ_TIMESTAMPS_KEY, JSON.stringify(timestamps));
    const event = new CustomEvent('readTimestampsUpdated');
    window.dispatchEvent(event);
  }, []);

  const updateClubReadTimestamp = useCallback((clubId: string) => {
    try {
      const timestampsJson = localStorage.getItem(READ_TIMESTAMPS_KEY);
      const timestamps = timestampsJson ? JSON.parse(timestampsJson) : { clubs: {}, dms: {} };
      
      // Update the timestamp for the club
      timestamps.clubs[clubId] = Date.now();
      
      // Save back to storage
      localStorage.setItem(READ_TIMESTAMPS_KEY, JSON.stringify(timestamps));
      
      // Trigger event for any listeners
      window.dispatchEvent(new CustomEvent('readTimestampsUpdated'));
      
      console.log(`[useLocalStorage] Updated read timestamp for club ${clubId}`);
    } catch (error) {
      console.error('[useLocalStorage] Error updating club read timestamp:', error);
    }
  }, []);

  const updateDmReadTimestamp = useCallback((conversationId: string) => {
    try {
      const timestampsJson = localStorage.getItem(READ_TIMESTAMPS_KEY);
      const timestamps = timestampsJson ? JSON.parse(timestampsJson) : { clubs: {}, dms: {} };
      
      // Update the timestamp for the conversation
      timestamps.dms[conversationId] = Date.now();
      
      // Save back to storage
      localStorage.setItem(READ_TIMESTAMPS_KEY, JSON.stringify(timestamps));
      
      // Trigger event for any listeners
      window.dispatchEvent(new CustomEvent('readTimestampsUpdated'));
      
      console.log(`[useLocalStorage] Updated read timestamp for DM ${conversationId}`);
    } catch (error) {
      console.error('[useLocalStorage] Error updating DM read timestamp:', error);
    }
  }, []);

  return {
    loadFromStorage,
    saveMessages,
    saveUnreadMessages,
    saveReadTimestamps,
    updateClubReadTimestamp,
    updateDmReadTimestamp
  };
};
