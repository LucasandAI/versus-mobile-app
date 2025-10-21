
import { useState, useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { createMessageId } from './utils/messageUtils';

export const useMessageDeduplication = () => {
  const [messageIds, setMessageIds] = useState<Set<string>>(new Set());

  const addMessagesWithoutDuplicates = useCallback((
    prevMessages: ChatMessage[],
    newMessages: ChatMessage[]
  ): ChatMessage[] => {
    const updatedMessages: ChatMessage[] = [...prevMessages];
    const updatedMessageIds = new Set(messageIds);
    let hasNewMessages = false;

    newMessages.forEach(msg => {
      const messageId = createMessageId(msg);
      if (!updatedMessageIds.has(messageId)) {
        updatedMessages.push(msg);
        updatedMessageIds.add(messageId);
        hasNewMessages = true;
      }
    });

    if (hasNewMessages) {
      setMessageIds(updatedMessageIds);
      return updatedMessages;
    }
    return prevMessages;
  }, [messageIds]);

  const clearMessageIds = useCallback(() => {
    setMessageIds(new Set());
  }, []);

  return {
    messageIds,
    addMessagesWithoutDuplicates,
    clearMessageIds
  };
};
