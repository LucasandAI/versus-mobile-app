import { useState, useEffect, useRef } from 'react';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useClubMessageSubscriptions } from '@/hooks/chat/messages/useClubMessageSubscriptions';

export const useClubMessages = (userClubs: Club[], isOpen: boolean) => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});
  const { currentUser } = useApp();
  const activeSubscriptionsRef = useRef<Record<string, boolean>>({});
  const initialMessagesFetchedRef = useRef<Record<string, boolean>>({});
  
  // Fetch initial messages when drawer opens
  useEffect(() => {
    if (!isOpen || !currentUser?.id || !userClubs.length) return;
    
    const fetchInitialMessages = async () => {
      try {
        // Get last 50 messages for each club
        const clubIds = userClubs.map(club => club.id);
        
        const { data, error } = await supabase
          .from('club_chat_messages')
          .select(`
            id, 
            message, 
            sender_id, 
            club_id, 
            timestamp,
            sender:sender_id (
              id, 
              name, 
              avatar
            )
          `)
          .in('club_id', clubIds)
          .order('timestamp', { ascending: false })
          .limit(50);
          
        if (error) throw error;
        
        if (data) {
          const messagesMap: Record<string, any[]> = {};
          
          // Group messages by club_id and normalize sender information
          data.forEach(message => {
            if (!messagesMap[message.club_id]) {
              messagesMap[message.club_id] = [];
            }
            
            // Ensure sender information is properly structured and check if message is from current user
            const normalizedMessage = {
              ...message,
              sender: message.sender || {
                id: message.sender_id,
                name: 'Unknown User',
                avatar: null
              },
              isUserMessage: String(message.sender_id) === String(currentUser.id)
            };
            
            console.log('[useClubMessages] Normalizing message:', {
              messageId: message.id,
              senderId: message.sender_id,
              currentUserId: currentUser.id,
              isUserMessage: normalizedMessage.isUserMessage
            });
            
            messagesMap[message.club_id].push(normalizedMessage);
          });
          
          // Sort messages by timestamp (oldest first) for each club
          Object.keys(messagesMap).forEach(clubId => {
            messagesMap[clubId] = messagesMap[clubId].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            // Mark this club's messages as fetched
            initialMessagesFetchedRef.current[clubId] = true;
          });
          
          console.log('[useClubMessages] Initial messages fetched:', {
            clubIds: Object.keys(messagesMap),
            messageCounts: Object.fromEntries(
              Object.entries(messagesMap).map(([clubId, messages]) => [
                clubId,
                messages.length
              ])
            )
          });
          
          setClubMessages(messagesMap);
        }
      } catch (error) {
        console.error('[useClubMessages] Error fetching initial messages:', error);
      }
    };
    
    // Only fetch messages for clubs that haven't been fetched yet
    const unfetchedClubs = userClubs.filter(club => !initialMessagesFetchedRef.current[club.id]);
    if (unfetchedClubs.length > 0) {
      fetchInitialMessages();
    }
  }, [isOpen, currentUser?.id, userClubs]);
  
  // Set up real-time subscription for messages
  useClubMessageSubscriptions(userClubs, isOpen, activeSubscriptionsRef, setClubMessages);
  
  return {
    clubMessages,
    setClubMessages
  };
};
