
import { useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DMConversation } from './types';
import debounce from 'lodash/debounce';
import { 
  fetchBasicConversations,
  extractOtherUserIds,
  createBasicConversationObjects,
  createUserMap,
  createLatestMessageMap,
  buildFinalConversations,
  showErrorToast
} from './utils/conversationUtils';

export const useConversationsFetcher = (isMounted: React.MutableRefObject<boolean>) => {
  const errorToastShown = useRef(false);
  
  const debouncedFetchConversations = useCallback(
    debounce(async (userId: string, setLoading: (isLoading: boolean) => void, setConversations: (conversations: DMConversation[]) => void) => {
      if (!isMounted.current || !userId) return;
      
      try {
        console.log('[useConversationsFetcher] Fetching conversations for user:', userId);
        setLoading(true);

        // Step 1: Fetch basic conversation data
        const validConversations = await fetchBasicConversations(userId);
        
        if (validConversations.length === 0) {
          if (isMounted.current) {
            setConversations([]);
            setLoading(false);
          }
          return [];
        }

        // Step 2: Get other user IDs and process initial conversation objects
        const otherUserIds = extractOtherUserIds(validConversations, userId);
        
        if (otherUserIds.length === 0) {
          if (isMounted.current) {
            setConversations([]);
            setLoading(false);
          }
          return [];
        }

        // Step 3: Create basic conversation objects for initial display
        const basicConversations = createBasicConversationObjects(validConversations, userId);
        
        // Set initial conversations with loading state
        const initialConversations = Object.values(basicConversations)
          .filter(conv => conv.userId !== userId) // Filter out self-conversations
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        if (isMounted.current) {
          setConversations(initialConversations);
          errorToastShown.current = false;
        }

        // Step 4: Fetch user details and latest messages in parallel
        const userPromise = supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', otherUserIds);

        const messagesPromise = supabase
          .from('direct_messages')
          .select('conversation_id, text, timestamp')
          .in('conversation_id', validConversations.map(c => c.id))
          .order('timestamp', { ascending: false });

        const [userResult, messagesResult] = await Promise.all([userPromise, messagesPromise]);

        console.log('[useConversationsFetcher] messagesResult:', messagesResult.data);

        if (!isMounted.current) return;

        if (userResult.error) throw userResult.error;
        if (messagesResult.error) throw messagesResult.error;

        // Step 5: Process fetched data
        const userMap = createUserMap(userResult.data);
        const latestMessageMap = createLatestMessageMap(messagesResult.data);
        console.log('[useConversationsFetcher] latestMessageMap:', latestMessageMap);

        // Step 6: Build final conversation objects
        const updatedConversations = buildFinalConversations(validConversations, userId, userMap, latestMessageMap)
          .filter(conv => conv.userId !== userId) // Filter out self-conversations
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by most recent message

        if (isMounted.current) {
          setConversations(updatedConversations);
          return updatedConversations;
        }

      } catch (error) {
        if (!isMounted.current) return;
        
        console.error('[useConversationsFetcher] Error fetching conversations:', error);
        
        // Show error toast only once
        errorToastShown.current = showErrorToast(
          "Could not load conversations. Please try again later.",
          errorToastShown.current
        );
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    }, 300),
    []
  );

  return { debouncedFetchConversations, errorToastShown };
};
