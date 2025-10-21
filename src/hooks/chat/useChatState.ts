
import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useMessageHandling } from './useMessageHandling';
import { useUnreadNotifications } from './useUnreadNotifications';
import { useChatActions } from './useChatActions';
import { useChatDeletion } from './useChatDeletion';
import { useRefreshState } from './useRefreshState';

export const useChatState = (open: boolean, onNewMessage?: (count: number) => void) => {
  const {
    loadFromStorage,
    saveMessages,
    saveUnreadMessages,
  } = useLocalStorage();

  const { unreadMessages, updateUnreadCount } = useUnreadNotifications(open, onNewMessage);
  const { messages, setMessages, handleNewMessage } = useMessageHandling(saveMessages, updateUnreadCount);
  const { sendMessageToClub } = useChatActions();
  const { deleteChat } = useChatDeletion();
  const { refreshKey, refreshChats } = useRefreshState();

  // Load data from localStorage on mount
  useEffect(() => {
    const data = loadFromStorage();
    setMessages(data.messages);
  }, [loadFromStorage, setMessages]);

  const handleSendClubMessage = async (message: string, clubId: string, setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>) => {
    if (!message.trim() || !clubId) {
      console.log('[useChatState] Cannot send empty message or missing clubId');
      return;
    }
    
    console.log('[useChatState] Sending club message:', { 
      clubId, 
      messagePreview: message.substring(0, 20) + (message.length > 20 ? '...' : '') 
    });
    
    const result = await sendMessageToClub(clubId, message, setClubMessages);
    
    if (result) {
      console.log('[useChatState] Message sent successfully');
    } else {
      console.error('[useChatState] Failed to send message - no result returned');
    }
  };

  return {
    messages,
    unreadMessages,
    refreshKey,
    refreshChats,
    handleNewMessage,
    sendMessageToClub: handleSendClubMessage,
    setUnreadMessages: updateUnreadCount,
    deleteChat
  };
};
