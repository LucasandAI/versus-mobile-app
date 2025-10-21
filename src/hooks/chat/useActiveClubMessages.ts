import { useState, useEffect, useMemo } from 'react';
import { ChatMessage } from '@/types/chat';

/**
 * Hook to sync with global club messages and handle real-time updates
 */
export function useActiveClubMessages(
  clubId?: string,
  globalMessages: Record<string, any[]> = {}
) {
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  
  // Memoize the messages from the global state to avoid unnecessary renders
  const messagesFromGlobal = useMemo(() => {
    if (!clubId) return [];
    return globalMessages[clubId] || [];
  }, [clubId, globalMessages]);
  
  // Keep local state in sync with global state
  useEffect(() => {
    if (clubId && messagesFromGlobal) {
      console.log('[useActiveClubMessages] Syncing messages for club:', clubId, messagesFromGlobal.length);
      setLocalMessages(messagesFromGlobal);
    } else {
      setLocalMessages([]);
    }
  }, [clubId, messagesFromGlobal]);
  
  return {
    messages: localMessages,
    setMessages: setLocalMessages
  };
}
