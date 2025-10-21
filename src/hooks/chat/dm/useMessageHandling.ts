
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useMessageHandling = (
  currentUserId: string | undefined,
  userId: string,
  conversationId: string,
  setMessages: React.Dispatch<React.SetStateAction<any[]>>,
  setIsSending: React.Dispatch<React.SetStateAction<boolean>>,
  createConversation: () => Promise<string | null>
) => {
  
  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !currentUserId || !userId) return;
    setIsSending(true);
    
    // Generate a unique temp ID for optimistic UI
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    // Create optimistic message
    const optimisticMessage = {
      id: tempId,
      text: message,
      sender: {
        id: currentUserId,
        name: 'You',
        avatar: undefined
      },
      timestamp,
      optimistic: true
    };

    try {
      // Add optimistic message to UI
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Get or create a conversation ID
      let actualConversationId = conversationId;
      if (!actualConversationId || actualConversationId === 'new') {
        console.log('[useMessageHandling] Creating/finding conversation for users:', currentUserId, userId);
        const newConversationId = await createConversation();
        if (!newConversationId) {
          throw new Error('Could not create conversation');
        }
        actualConversationId = newConversationId;
      }

      console.log('[useMessageHandling] Sending message to conversation:', actualConversationId);
      
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: currentUserId,
          receiver_id: userId,
          text: message,
          conversation_id: actualConversationId
        })
        .select('*')
        .single();

      if (error) throw error;
      
      // If this was a new conversation, update the UI
      if (conversationId !== actualConversationId) {
        window.dispatchEvent(new CustomEvent('conversationCreated', {
          detail: {
            userId,
            conversationId: actualConversationId
          }
        }));
      }
    } catch (error) {
      console.error('[useMessageHandling] Error sending message:', error);
      toast({
        title: "Error",
        description: "Could not send message",
        variant: "destructive"
      });
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      // Optimistically remove the message from UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Skip database deletion for optimistic messages
      if (messageId.startsWith('temp-')) {
        console.log('[useMessageHandling] Skipping deletion for optimistic message:', messageId);
        return;
      }
      
      const { error } = await supabase
        .from('direct_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('[useMessageHandling] Error deleting message:', error);
      toast({
        title: "Error",
        description: "Could not delete message",
        variant: "destructive"
      });
    }
  };

  return { handleSendMessage, handleDeleteMessage };
};
