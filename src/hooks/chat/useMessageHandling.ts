
import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/chat';

export const useMessageHandling = (
  saveMessages: (messages: Record<string, ChatMessage[]>) => void,
  updateUnreadCount: (chatId: string, count: number) => void
) => {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const handleNewMessage = useCallback((
    clubId: string,
    message: ChatMessage,
    isOpen: boolean
  ) => {
    console.log('[useMessageHandling] Handling new message for club:', clubId);
    
    setMessages(prev => {
      const updated = {
        ...prev,
        [clubId]: [...(prev[clubId] || []), message]
      };
      saveMessages(updated);
      return updated;
    });

    if (!isOpen) {
      updateUnreadCount(clubId, 1);
    }
  }, [saveMessages, updateUnreadCount]);

  return {
    messages,
    setMessages,
    handleNewMessage
  };
};
