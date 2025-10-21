
import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/context/AppContext';
import { DMConversation } from './types';
import { useConversationsFetcher } from './useConversationsFetcher';

// Add default avatar constant
const DEFAULT_AVATAR = '/placeholder.svg';

export const useDirectConversations = (hiddenDMIds: string[] = []) => {
  const [conversations, setConversations] = useState<DMConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isSessionReady } = useApp();
  const fetchAttemptedRef = useRef(false);
  const isMounted = useRef(true);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get the debounced fetch function
  const { debouncedFetchConversations } = useConversationsFetcher(isMounted);

  const fetchConversations = useCallback(() => {
    // Strong guard clause to prevent fetching without session or user
    if (!isSessionReady || !currentUser?.id) {
      console.log('[useDirectConversations] Session or user not ready, skipping fetch');
      return Promise.resolve([]);
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Use a short timeout to ensure auth is fully ready
    return new Promise<DMConversation[]>((resolve) => {
      fetchTimeoutRef.current = setTimeout(() => {
        if (!isMounted.current) {
          resolve([]);
          return;
        }

        console.log('[useDirectConversations] Session and user ready, fetching conversations');
        fetchAttemptedRef.current = true;
        debouncedFetchConversations(currentUser.id, setLoading, (convs: DMConversation[]) => {
          // Filter out self-conversations and ensure sorting
          const filteredConvs = convs
            .filter(c => c.userId !== currentUser.id)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setConversations(filteredConvs);
          resolve(filteredConvs);
        });
      }, 300);
    });
  }, [currentUser?.id, isSessionReady, debouncedFetchConversations]);

  // Cleanup effect
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      debouncedFetchConversations.cancel();
    };
  }, [debouncedFetchConversations]);

  // Filter out hidden conversations and self-conversations, maintain sort order
  const filteredConversations = conversations.filter(
    conv => !hiddenDMIds.includes(conv.userId) && 
           !hiddenDMIds.includes(conv.conversationId) &&
           conv.userId !== currentUser?.id // Filter out self-conversations
  );

  return {
    conversations: filteredConversations,
    loading,
    fetchConversations
  };
};
