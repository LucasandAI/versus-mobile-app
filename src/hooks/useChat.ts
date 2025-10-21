
import { useState, useEffect } from 'react';
import { useLocalStorage } from './chat/useLocalStorage';
import { useMessages } from './chat/useMessages';
import { useUnreadNotifications } from './chat/useUnreadNotifications';
import { useChatActions } from './chat/useChatActions';
import { useChatDeletion } from './chat/useChatDeletion';

export const useChat = (open: boolean, onNewMessage?: (count: number) => void) => {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  
  const {
    loadFromStorage,
    saveMessages
  } = useLocalStorage();

  const { unreadMessages, updateUnreadCount } = useUnreadNotifications(open, onNewMessage);
  const { messages, setMessages, handleNewMessage } = useMessages(saveMessages, updateUnreadCount);
  
  const { sendMessageToClub } = useChatActions();
  const { deleteChat } = useChatDeletion();

  // Load data from localStorage on mount
  useEffect(() => {
    const data = loadFromStorage();
    setMessages(data.messages);
  }, [loadFromStorage, setMessages]);

  const refreshChats = () => {
    setRefreshKey(Date.now());
  };

  return {
    messages,
    unreadMessages,
    refreshKey,
    refreshChats,
    handleNewMessage,
    sendMessageToClub,
    setUnreadMessages: updateUnreadCount,
    deleteChat
  };
};

export type ChatHookReturn = ReturnType<typeof useChat>;
