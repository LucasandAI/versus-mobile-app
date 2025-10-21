
import { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';
import { useMessageDeduplication } from './useMessageDeduplication';
import { useMessageFetching } from './useMessageFetching';
import { findMatchingMessage } from './utils/messageUtils';
import { useApp } from '@/context/AppContext';

export const useDMMessages = (userId: string, userName: string, conversationId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const { isSessionReady, currentUser } = useApp();
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const conversationIdRef = useRef(conversationId);
  const hasFetchedRef = useRef(false);

  const { messageIds, addMessagesWithoutDuplicates, clearMessageIds } = useMessageDeduplication();
  const { fetchMessages } = useMessageFetching(userId, userName, conversationId, currentUser);

  // Update ref when conversation ID changes
  useEffect(() => {
    conversationIdRef.current = conversationId;
    // Reset fetch flag when conversation changes
    hasFetchedRef.current = false;
  }, [conversationId]);

  // Clean up on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      clearMessageIds();
    };
  }, [clearMessageIds]);

  // Fetch messages when conversation details change
  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    // Skip if already fetched for this conversation
    if (hasFetchedRef.current) {
      return;
    }

    const loadMessages = async () => {
      if (!isSessionReady || !conversationId || conversationId === 'new') {
        setLoading(false);
        return;
      }

      setLoading(true);
      
      fetchTimeoutRef.current = setTimeout(async () => {
        const fetchedMessages = await fetchMessages();
        
        if (isMounted.current) {
          setMessages(prev => addMessagesWithoutDuplicates(prev, fetchedMessages));
          setLoading(false);
          hasFetchedRef.current = true;
        }
      }, 300); // Add a delay to prevent race conditions
    };

    if (isSessionReady && conversationId && conversationId !== 'new') {
      // Load messages when a conversation is selected
      loadMessages();
    } else {
      setLoading(false); // Make sure to set loading to false for new conversations
    }
  }, [userId, currentUser?.id, conversationId, fetchMessages, isSessionReady, addMessagesWithoutDuplicates]);

  const addMessage = (message: ChatMessage): boolean => {
    const existingMessage = findMatchingMessage(messages, message);
    if (!existingMessage) {
      setMessages(prev => [...prev, message]);
      return true;
    }
    return false;
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const refreshMessages = async () => {
    // Only run if session is ready, user is authenticated, and we have a valid conversation ID
    if (!isSessionReady || !currentUser?.id || !conversationId || conversationId === 'new') {
      console.log('[refreshMessages] Skipping refresh - session or conversation not ready');
      return;
    }
    
    try {
      const fetchedMessages = await fetchMessages();
      if (isMounted.current) {
        setMessages(prev => addMessagesWithoutDuplicates(prev, fetchedMessages));
      }
    } catch (error) {
      // Prevent error propagation to avoid infinite toasts
      console.error('[refreshMessages] Error refreshing messages:', error);
    }
  };

  return {
    messages,
    setMessages,
    addMessage,
    loading,
    isSending,
    setIsSending,
    refreshMessages,
    deleteMessage
  };
};

export default useDMMessages;
