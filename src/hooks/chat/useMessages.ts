
import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/chat';

export const useMessages = (
  saveMessages: (messages: Record<string, ChatMessage[]>) => void,
  updateUnreadCount: (chatId: string, count: number) => void
) => {
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  const handleNewMessage = useCallback((
    clubId: string,
    message: ChatMessage,
    isOpen: boolean
  ) => {
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
