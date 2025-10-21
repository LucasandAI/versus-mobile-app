
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from './AppContext';
import { toast } from '@/hooks/use-toast';
import { useConversationsFetcher } from '@/hooks/chat/dm/useConversationsFetcher';
import { DMConversation } from '@/hooks/chat/dm/types';

interface DirectConversationsContextValue {
  conversations: DMConversation[];
  loading: boolean;
  hasLoaded: boolean;
  fetchConversations: (forceRefresh?: boolean) => Promise<void>;
  refreshConversations: () => Promise<void>;
  getOrCreateConversation: (userId: string, userName: string, userAvatar?: string) => Promise<DMConversation | null>;
}

const DirectConversationsContext = React.createContext<DirectConversationsContextValue>({
  conversations: [],
  loading: false,
  hasLoaded: false,
  fetchConversations: async () => {},
  refreshConversations: async () => {},
  getOrCreateConversation: async () => null,
});

export const useDirectConversationsContext = () => React.useContext(DirectConversationsContext);

// Define payload types for real-time updates
interface RealtimeMessagePayload {
  new?: {
    conversation_id?: string;
    id?: string;
    text?: string;
    timestamp?: string;
    [key: string]: any;
  };
  old?: {
    conversation_id?: string;
    id?: string;
    [key: string]: any;
  };
  eventType?: 'INSERT' | 'UPDATE' | 'DELETE';
}

export const DirectConversationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations] = React.useState<DMConversation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [hasLoaded, setHasLoaded] = React.useState(false);
  const { currentUser } = useApp();
  const isMounted = React.useRef(true);
  const { debouncedFetchConversations } = useConversationsFetcher(isMounted);

  const fetchConversations = React.useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && hasLoaded) {
      console.log('[DirectConversationsProvider] Using cached conversations');
      return;
    }
    
    if (!currentUser?.id) {
      console.warn('[DirectConversationsProvider] Cannot fetch conversations, no current user');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('[DirectConversationsProvider] Fetching conversations for user:', currentUser.id);
      
      await debouncedFetchConversations(currentUser.id, setLoading, (convs: DMConversation[]) => {
        if (isMounted.current) {
          // Ensure conversations are sorted immediately when set
          const sortedConversations = [...convs].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          setConversations(sortedConversations);
          setHasLoaded(true);
        }
      });
      
    } catch (error) {
      console.error('[DirectConversationsProvider] Error fetching conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [currentUser?.id, hasLoaded, debouncedFetchConversations]);
  
  const refreshConversations = React.useCallback(async () => {
    await fetchConversations(true);
  }, [fetchConversations]);
  
  const getOrCreateConversation = React.useCallback(async (
    userId: string, 
    userName: string, 
    userAvatar = '/placeholder.svg'
  ): Promise<DMConversation | null> => {
    if (!currentUser?.id) {
      console.warn('[DirectConversationsProvider] Cannot get conversation, no current user');
      return null;
    }
    
    try {
      // Check if we already have this conversation in our local state
      const existingConversation = conversations.find(c => c.userId === userId);
      if (existingConversation) {
        return existingConversation;
      }
      
      // Check for existing conversation in database
      const { data: existingConv, error: fetchError } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUser.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUser.id})`)
        .maybeSingle();
        
      if (fetchError) {
        throw fetchError;
      }
      
      let conversationId: string;
      
      if (existingConv) {
        // Use existing conversation
        conversationId = existingConv.id;
        console.log('[DirectConversationsProvider] Found existing conversation:', conversationId);
      } else {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('direct_conversations')
          .insert({
            user1_id: currentUser.id,
            user2_id: userId
          })
          .select('id')
          .single();
          
        if (createError) {
          throw createError;
        }
        
        conversationId = newConv.id;
        console.log('[DirectConversationsProvider] Created new conversation:', conversationId);
      }
      
      // Create conversation object
      const conversation: DMConversation = {
        conversationId,
        userId,
        userName,
        userAvatar,
        lastMessage: '',
        timestamp: new Date().toISOString()
      };
      
      // Update local state with immediate sorting
      setConversations(prev => {
        // Don't add duplicate
        if (prev.some(c => c.conversationId === conversationId)) {
          return prev;
        }
        
        // Add new conversation and sort immediately
        const updatedConversations = [conversation, ...prev];
        return updatedConversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
      
      return conversation;
      
    } catch (error) {
      console.error('[DirectConversationsProvider] Error in getOrCreateConversation:', error);
      toast({
        title: "Error",
        description: "Could not load or create conversation",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser?.id, conversations]);
  
  // Cleanup effect
  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Real-time subscription for direct_messages
  React.useEffect(() => {
    if (!currentUser?.id) return;
    const channel = supabase
      .channel('realtime-conversations-list')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_messages',
        },
        (payload: RealtimeMessagePayload) => {
          const msg = payload.new || payload.old;
          if (!msg || (!msg.conversation_id && !msg.id)) return;
          
          setConversations(prev => {
            // Find and update the conversation
            const updatedConversations = prev.map(conv => {
              if (conv.conversationId === msg.conversation_id) {
                if (payload.eventType === 'DELETE') {
                  // On delete, refetch the latest message for this conversation
                  // (for simplicity, just clear lastMessage and timestamp; a full refetch will restore it)
                  return { ...conv, lastMessage: '', timestamp: conv.timestamp };
                } else if (payload.new && payload.new.text && payload.new.timestamp) {
                  // On insert/update, update lastMessage and timestamp
                  return {
                    ...conv,
                    lastMessage: payload.new.text,
                    timestamp: payload.new.timestamp
                  };
                }
              }
              return conv;
            });
            
            // Sort conversations by timestamp immediately (most recent first)
            return updatedConversations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);
  
  const contextValue: DirectConversationsContextValue = {
    conversations,
    loading,
    hasLoaded,
    fetchConversations,
    refreshConversations,
    getOrCreateConversation
  };
  
  return (
    <DirectConversationsContext.Provider value={contextValue}>
      {children}
    </DirectConversationsContext.Provider>
  );
};
