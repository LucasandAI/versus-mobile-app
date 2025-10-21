import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { ChatMessage } from '@/types/chat';

export const useDirectMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { currentUser } = useApp();

  // Fetch initial messages
  useEffect(() => {
    if (!conversationId || !currentUser?.id || conversationId === 'new') return;

    const fetchMessages = async () => {
      try {
        console.log('[useDirectMessages] Fetching messages for conversation:', conversationId);
        
        // First fetch messages
        const { data, error } = await supabase
          .from('direct_messages')
          .select(`
            id,
            text,
            sender_id,
            timestamp
          `)
          .eq('conversation_id', conversationId)
          .order('timestamp', { ascending: true });

        if (error) throw error;

        if (data) {
          // Get unique sender IDs
          const senderIds = [...new Set(data.map(msg => msg.sender_id))];
          let userMap: Record<string, any> = {};
          
          // Fetch user data for all senders
          if (senderIds.length > 0) {
            const { data: usersData, error: usersError } = await supabase
              .from('users')
              .select('id, name, avatar')
              .in('id', senderIds);
              
            if (usersError) {
              console.error('[useDirectMessages] Error fetching user data:', usersError);
            } else {
              userMap = (usersData || []).reduce((acc: Record<string, any>, user) => {
                acc[user.id] = user;
                return acc;
              }, {});
            }
          }

          // Normalize messages with user data
          const normalizedMessages = data.map(message => {
            const senderInfo = userMap[message.sender_id] || {
              id: message.sender_id,
              name: 'Unknown User',
              avatar: null
            };

            return {
              id: message.id,
              text: message.text,
              timestamp: message.timestamp,
              sender: {
                id: senderInfo.id,
                name: senderInfo.name,
                avatar: senderInfo.avatar
              },
              isUserMessage: String(message.sender_id) === String(currentUser.id)
            };
          });
          
          console.log('[useDirectMessages] Normalized messages:', normalizedMessages);
          setMessages(normalizedMessages);
        }
      } catch (error) {
        console.error('[useDirectMessages] Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`direct_messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // Skip if we already have this message
          if (messages.some(msg => msg.id === newMessage.id)) {
            console.log('[useDirectMessages] Skipping duplicate message:', newMessage.id);
            return;
          }
          
          // Fetch sender data for the new message
          const { data: userData } = await supabase
            .from('users')
            .select('id, name, avatar')
            .eq('id', newMessage.sender_id)
            .single();
            
          const normalizedMessage = {
            id: newMessage.id,
            text: newMessage.text,
            timestamp: newMessage.timestamp,
            sender: userData || {
              id: newMessage.sender_id,
              name: 'Unknown User',
              avatar: null
            },
            isUserMessage: String(newMessage.sender_id) === String(currentUser.id)
          };
          
          setMessages(prev => {
            // Double check we don't have this message
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, normalizedMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, currentUser?.id]);

  return { messages, setMessages };
}; 