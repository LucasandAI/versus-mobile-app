import { ChatMessage } from '@/types/chat';

export const useMessageNormalization = (currentUserId: string | null, getMemberName: (senderId: string) => string) => {
  const normalizeMessage = (message: any): ChatMessage => {
    console.log('[useMessageNormalization] Normalizing message:', message);
    
    // Determine if message is from current user - check all possible sender ID locations
    const messageSenderId = message.sender?.id || message.sender_id;
    const isUserMessage = currentUserId && messageSenderId && String(currentUserId) === String(messageSenderId);
    
    console.log('[useMessageNormalization] Message sender check:', {
      messageSenderId,
      currentUserId,
      isUserMessage,
      hasSender: !!message.sender,
      hasSenderId: !!message.sender_id
    });
    
    // More robust check for a complete sender object with required properties
    if (
      typeof message.sender === 'object' &&
      message.sender !== null &&
      typeof message.sender.id !== 'undefined' &&
      typeof message.sender.name === 'string'
    ) {
      console.log('[useMessageNormalization] Using existing complete sender info:', message.sender);
      
      // Return the message exactly as is, preserving all sender information
      return {
        id: message.id,
        text: message.text !== undefined ? message.text : message.message,
        sender: {
          id: String(message.sender.id),
          name: message.sender.name,
          avatar: message.sender.avatar
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: Boolean(message.isSupport),
        optimistic: Boolean(message.optimistic),
        isUserMessage
      };
    }
    
    // Handle messages with sender object but incomplete information
    if (message.sender && typeof message.sender === 'object') {
      console.log('[useMessageNormalization] Message has sender object but may need enhancement:', message.sender);
      
      const senderName = typeof message.sender.name === 'string' && message.sender.name !== '' 
                        ? message.sender.name 
                        : getMemberName(message.sender.id);
                        
      const senderAvatar = typeof message.sender.avatar === 'string' && message.sender.avatar !== '' 
                         ? message.sender.avatar 
                         : undefined;
      
      console.log(`[useMessageNormalization] Using name="${senderName}", avatar="${senderAvatar || 'undefined'}"`);
      
      return {
        id: message.id,
        text: message.message || message.text,
        sender: {
          id: String(message.sender.id),
          name: senderName,
          avatar: senderAvatar
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: Boolean(message.isSupport),
        isUserMessage
      };
    }
    
    // If it's from Supabase club_chat_messages table without sender object
    if (message.message !== undefined && message.sender_id !== undefined) {
      console.log('[useMessageNormalization] Message from database table without sender object:', message.sender_id);
      return {
        id: message.id,
        text: message.message,
        sender: {
          id: String(message.sender_id),
          name: getMemberName(message.sender_id),
          avatar: undefined
        },
        timestamp: message.timestamp || message.created_at || new Date().toISOString(),
        isSupport: false,
        isUserMessage
      };
    }
    
    // Last resort fallback with enhanced logging - should rarely happen
    console.warn('[useMessageNormalization] Unrecognized message format:', message);
    return {
      id: message.id || `unknown-${Date.now()}`,
      text: message.message || message.text || "Unknown message",
      sender: {
        id: String(message.sender_id || message.sender?.id || "unknown"),
        name: message.sender?.name || getMemberName(message.sender_id || message.sender?.id || "unknown"),
        avatar: message.sender?.avatar || undefined
      },
      timestamp: message.timestamp || message.created_at || new Date().toISOString(),
      isSupport: false,
      isUserMessage
    };
  };

  return { normalizeMessage };
};
