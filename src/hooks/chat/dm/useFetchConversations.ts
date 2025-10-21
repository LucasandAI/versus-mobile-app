
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useConversationsPersistence } from './useConversationsPersistence';
import type { DMConversation } from './types';
import debounce from 'lodash/debounce';

export const useFetchConversations = (currentUserId: string | undefined) => {
  const { loadConversationsFromStorage, saveConversationsToStorage } = useConversationsPersistence();
  const errorToastShownRef = useRef(false);
  
  const fetchConversations = useCallback(debounce(async () => {
    try {
      // Strong guard clause - prevent fetching without a user ID or if it's not ready
      if (!currentUserId) {
        console.log('[fetchConversations] No current user ID, skipping fetch');
        const storedConversations = loadConversationsFromStorage();
        // Pre-sort stored conversations to prevent flash
        return storedConversations.sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());
      }

      console.log('[fetchConversations] Fetching conversations for user:', currentUserId);

      // Load stored conversations first
      const storedConversations = loadConversationsFromStorage();
      console.log('[fetchConversations] Loaded stored conversations:', storedConversations.length);

      const { data: messages, error: messagesError } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, text, timestamp, conversation_id')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('timestamp', { ascending: false });

      if (messagesError) throw messagesError;
      
      if (!messages || messages.length === 0) {
        console.log('[fetchConversations] No messages found in database');
        // Pre-sort stored conversations before returning
        return storedConversations.sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());
      }

      // Get unique IDs of the other participants in conversations
      const uniqueUserIds = new Set<string>();
      messages.forEach(msg => {
        // The other participant is the one who is not the current user
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        
        // Skip adding yourself as a conversation partner (prevents self-conversations)
        if (otherUserId !== currentUserId) {
          uniqueUserIds.add(otherUserId);
        }
      });

      // If no valid conversation partners found, return early
      if (uniqueUserIds.size === 0) {
        console.log('[fetchConversations] No valid conversation partners found');
        // Pre-sort stored conversations before returning
        return storedConversations.sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());
      }

      // Fetch user information for conversation partners
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', Array.from(uniqueUserIds));

      if (usersError) throw usersError;
      if (!users) return [];

      // Map of user info by ID for quick lookup
      const userMap = users.reduce((map: Record<string, any>, user) => {
        map[user.id] = user;
        return map;
      }, {});

      // Create conversation objects showing the OTHER user's information
      const conversationsMap = new Map<string, DMConversation>();
      messages.forEach(msg => {
        // Determine which user is the other participant
        const otherUserId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        
        // Skip self-conversations where the sender and receiver are the same
        if (otherUserId === currentUserId) {
          return;
        }
        
        const otherUser = userMap[otherUserId];
        
        if (otherUser && (!conversationsMap.has(otherUserId) || 
            new Date(msg.timestamp) > new Date(conversationsMap.get(otherUserId)?.timestamp || ''))) {
          conversationsMap.set(otherUserId, {
            conversationId: msg.conversation_id || `temp_${otherUserId}`, // Use existing conversation ID or create a temporary one
            userId: otherUserId,
            userName: otherUser.name,
            userAvatar: otherUser.avatar || '/placeholder.svg',
            lastMessage: msg.text,
            timestamp: msg.timestamp
          });
        }
      });

      // Merge with stored conversations, prioritizing newer timestamps
      // Sort immediately during data preparation to prevent flash
      const mergedConversations = Array.from(conversationsMap.values())
        .concat(storedConversations)
        .sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime())
        // Remove duplicates based on userId
        .filter((conv, index, self) => 
          index === self.findIndex(c => c.userId === conv.userId)
        )
        // Filter out any self-conversations
        .filter(conv => conv.userId !== currentUserId);

      // Save merged conversations to storage (already sorted)
      saveConversationsToStorage(mergedConversations);

      // Reset error toast flag on successful fetch
      errorToastShownRef.current = false;
      
      return mergedConversations;
    } catch (error) {
      console.error('Error loading conversations:', error);
      
      // Only show toast message once per error session
      if (!errorToastShownRef.current) {
        toast({
          title: "Error",
          description: "Could not load conversations",
          variant: "destructive"
        });
        errorToastShownRef.current = true;
      }
      const storedConversations = loadConversationsFromStorage();
      // Pre-sort stored conversations even in error case
      return storedConversations.sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());
    }
  }, 300), [currentUserId, loadConversationsFromStorage, saveConversationsToStorage]);

  return fetchConversations;
};
