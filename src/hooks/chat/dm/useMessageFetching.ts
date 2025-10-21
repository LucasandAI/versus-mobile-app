
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessage } from '@/types/chat';
import { toast } from '@/hooks/use-toast';

export const useMessageFetching = (
  userId: string,
  userName: string,
  conversationId: string,
  currentUser: any
) => {
  const fetchMessages = useCallback(async () => {
    if (!userId || !currentUser?.id || !conversationId || conversationId === 'new') {
      return [];
    }

    try {
      console.log(`[useMessageFetching] Fetching messages for conversation ${conversationId}`);
      
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
      
      const senderIds = [...new Set(data?.map(msg => msg.sender_id) || [])];
      let userMap: Record<string, any> = {};
      
      if (senderIds.length > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', senderIds);
          
        if (usersError) {
          console.error('[useMessageFetching] Error fetching user data:', usersError);
          // Continue with partial data rather than failing completely
        } else {
          userMap = (usersData || []).reduce((acc: Record<string, any>, user) => {
            acc[user.id] = user;
            return acc;
          }, {});
        }
      }

      return (data || []).map((msg): ChatMessage => {
        const senderInfo = userMap[msg.sender_id] || {
          id: msg.sender_id,
          name: msg.sender_id === currentUser.id ? currentUser.name : userName,
          avatar: undefined
        };

        return {
          id: msg.id,
          text: msg.text,
          sender: {
            id: senderInfo.id,
            name: senderInfo.name,
            avatar: senderInfo.avatar
          },
          timestamp: msg.timestamp,
        };
      });
    } catch (error) {
      console.error('[useMessageFetching] Error fetching direct messages:', error);
      // Only show toast for network errors, not for expected missing data
      const shouldShowToast = error instanceof Error && 
        !error.message.includes('not found') && 
        !error.message.includes('not ready');
        
      if (shouldShowToast) {
        toast({
          title: "Error",
          description: "Could not load messages",
          variant: "destructive"
        });
      }
      return [];
    }
  }, [userId, currentUser, userName, conversationId]);

  return { fetchMessages };
};
