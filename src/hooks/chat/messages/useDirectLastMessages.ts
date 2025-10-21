import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LastDirectMessage {
  conversation_id: string;
  text: string;
  timestamp: string;
}

export const useDirectLastMessages = (userId: string | undefined) => {
  const [lastMessages, setLastMessages] = useState<Record<string, LastDirectMessage>>({});
  const lastMessagesRef = useRef<Record<string, LastDirectMessage>>({});

  // Keep reference in sync with state
  useEffect(() => {
    lastMessagesRef.current = lastMessages;
  }, [lastMessages]);

  useEffect(() => {
    if (!userId) return;

    // Initial fetch of latest messages
    const fetchInitialMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('direct_messages')
          .select('id, conversation_id, sender_id, receiver_id, text, timestamp')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
          .order('timestamp', { ascending: false });

        if (error) throw error;

        if (data) {
          // Process to get latest message per conversation
          const latestMessages: Record<string, LastDirectMessage> = {};

          data.forEach(message => {
            const conversationId = message.conversation_id;
            if (!conversationId) return;

            if (!latestMessages[conversationId] || 
                new Date(message.timestamp) > new Date(latestMessages[conversationId].timestamp)) {
              latestMessages[conversationId] = {
                conversation_id: conversationId,
                text: message.text || '',
                timestamp: message.timestamp
              };
            }
          });

          setLastMessages(latestMessages);
        }
      } catch (error) {
        console.error('[useDirectLastMessages] Error fetching messages:', error);
      }
    };

    fetchInitialMessages();

    // Subscribe to real-time updates
    const channel = supabase.channel('direct-messages-last')
      .on('postgres_changes', 
          {
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages',
            filter: `sender_id=eq.${userId}` 
          },
          (payload) => {
            const msg = payload.new;
            if (!msg) return;
            const conversationId = msg.conversation_id;
            
            if (conversationId) {
              // Update the last message for this conversation
              setLastMessages(prev => ({
                ...prev,
                [conversationId]: {
                  conversation_id: conversationId,
                  text: msg.text || '',
                  timestamp: msg.timestamp || new Date().toISOString()
                }
              }));
            }
          })
      .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'direct_messages',
            filter: `receiver_id=eq.${userId}`
          },
          (payload) => {
            const msg = payload.new;
            if (!msg) return;
            const conversationId = msg.conversation_id;
            
            if (conversationId) {
              // Update the last message for this conversation
              setLastMessages(prev => ({
                ...prev,
                [conversationId]: {
                  conversation_id: conversationId,
                  text: msg.text || '',
                  timestamp: msg.timestamp || new Date().toISOString()
                }
              }));
            }
          })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return lastMessages;
};
