
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { isConversationActive, hasBeenViewedSince } from '@/utils/chat/activeConversationTracker';
import { getReadTimestamp } from '@/utils/chat/readStatusStorage';

// Type for new message payload
interface MessagePayload {
  new: {
    id: string;
    club_id: string;
    sender_id: string;
    message: string;
    timestamp: string;
    created_at?: string;
    sender_name?: string;
    read_by?: string[];  
    unread_by?: string[]; // Added for the new unread_by array
    [key: string]: any;
  };
  [key: string]: any;
}

// Type for delete message payload
interface DeletePayload {
  old: {
    id: string;
    club_id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// Type guard to check if payload contains club_id
function hasClubId(payload: any): payload is { new: { club_id: string } } {
  return payload && 
         payload.new && 
         typeof payload.new === 'object' && 
         'club_id' in payload.new &&
         typeof payload.new.club_id === 'string';
}

export const handleNewMessagePayload = async (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  userClubs: Club[],
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>,
  currentUser: any,
  selectedClubId: string | null
) => {
  // Make sure we have a valid payload with club_id
  if (!hasClubId(payload)) {
    console.log('[subscriptionHandlers] Invalid payload or missing club_id', payload);
    return;
  }

  const messagePayload = payload as unknown as MessagePayload;
  const clubId = messagePayload.new.club_id;
  const messageId = messagePayload.new.id;
  const senderId = messagePayload.new.sender_id;
  const isCurrentUserMessage = senderId === currentUser?.id;
  const messageTime = new Date(messagePayload.new.created_at || messagePayload.new.timestamp).getTime();
  
  // Check if the message is already marked as read by current user
  const readBy = messagePayload.new.read_by || [];
  const unreadBy = messagePayload.new.unread_by || [];
  const isAlreadyRead = currentUser?.id && readBy.includes(currentUser.id);
  const isUnread = currentUser?.id && unreadBy.includes(currentUser.id);
  
  // Validate all required fields
  if (!clubId || !messageId || !senderId) {
    console.error('[subscriptionHandlers] Missing required fields in message payload:', 
      { clubId, messageId, senderId });
    return;
  }
  
  console.log('[subscriptionHandlers] Processing new message:', {
    messageId,
    clubId,
    senderId,
    isCurrentUserMessage,
    isAlreadyRead,
    isUnread,
    selectedClubId,
    isSelected: selectedClubId === clubId
  });

  try {
    // Use optimistic UI update approach - immediately render with available data
    let senderDetails = messagePayload.new.sender || null;
    
    // If sender info isn't in the payload, use a placeholder until we can fetch it
    if (!senderDetails && senderId) {
      // Start with a placeholder
      senderDetails = {
        id: senderId,
        name: isCurrentUserMessage ? 'You' : 'Loading...',
        avatar: null
      };
      
      // Try to fetch actual sender details in the background
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar')
          .eq('id', senderId)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors
        
        if (!userError && userData) {
          senderDetails = userData;
        }
      } catch (error) {
        console.error('[subscriptionHandlers] Error retrieving sender details:', error);
        // Continue with placeholder data if fetch fails
      }
    }
    
    // Create normalized message object
    const normalizedMessage = {
      ...messagePayload.new,
      sender: senderDetails || {
        id: senderId,
        name: isCurrentUserMessage ? 'You' : 'Unknown User',
        avatar: null
      },
      isUserMessage: isCurrentUserMessage,
      isRead: isAlreadyRead || !isUnread
    };

    // Update club messages - ensure message isn't duplicated
    // Use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
      setClubMessages((prevMessages) => {
        // Check if we already have this message
        const existingMessages = prevMessages[clubId] || [];
        const messageExists = existingMessages.some(msg => msg.id === messageId);
        
        if (messageExists) {
          console.log(`[subscriptionHandlers] Message ${messageId} already exists, skipping`);
          return prevMessages;
        }
        
        console.log(`[subscriptionHandlers] Adding message ${messageId} to club ${clubId}`);
        
        // Add the new message to the correct club
        return {
          ...prevMessages,
          [clubId]: [...existingMessages, normalizedMessage]
        };
      });
    });

    // Check if the conversation is active (user is currently viewing it)
    const isActive = isConversationActive('club', clubId);
    
    // Check if this conversation has been read since this message was sent
    const readTimestamp = getReadTimestamp('club', clubId);
    const hasBeenRead = readTimestamp > messageTime || isAlreadyRead || !isUnread;
    
    // If conversation is active and message is not from current user, immediately mark it as read
    if (isActive && !isCurrentUserMessage && isUnread && currentUser?.id) {
      console.log('[subscriptionHandlers] Conversation is active, marking message as read:', messageId);
      
      // Optimistic UI update first
      window.dispatchEvent(new CustomEvent('message-read', {
        detail: { messageId, type: 'club', clubId }
      }));
      
      // Then update in database
      try {
        await supabase.rpc('mark_message_as_read', {
          p_message_id: messageId,
          p_user_id: currentUser.id,
          p_message_type: 'club'
        });
      } catch (error) {
        console.error('[subscriptionHandlers] Error marking message as read:', error);
      }
    }
    
    // Determine if this could be the first message in a conversation
    const isFirstMessage = !prevMessages || !prevMessages[clubId] || prevMessages[clubId].length === 0;
    
    // Always dispatch an event to notify about the new message
    window.dispatchEvent(new CustomEvent('club-message-received', { 
      detail: { 
        clubId, 
        message: normalizedMessage,
        isUserMessage: isCurrentUserMessage,
        isFirstMessage,
        messageTime,
        messageId
      } 
    }));
    
    // Dispatch a specific event for message preview updates
    window.dispatchEvent(new CustomEvent('message-preview-update', { 
      detail: { 
        type: 'club',
        id: clubId,
        message: normalizedMessage.message,
        sender: normalizedMessage.sender,
        timestamp: messageTime
      } 
    }));
    
    // If the message is not from the current user, marked as unread, and the conversation is not active,
    // trigger a badge update
    if (!isCurrentUserMessage && !isActive && isUnread) {
      console.log('[subscriptionHandlers] Dispatching unread event for club message:', clubId);
      
      // Dispatch event to update unread messages
      window.dispatchEvent(new CustomEvent('unread-club-message', { 
        detail: { 
          clubId,
          messageTimestamp: messageTime,
          messageId
        } 
      }));
      
      // Special handling for potentially first message - ensure badge is updated
      if (isFirstMessage) {
        // Force a badge refresh with immediate flag
        window.dispatchEvent(new CustomEvent('badge-refresh-required', {
          detail: { 
            immediate: true, 
            forceTotalRecalculation: true 
          }
        }));
        
        // Force an unread message update to ensure the first message is caught
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated', {
          detail: { forceTotalRecalculation: true }
        }));
      } else {
        // Regular badge refresh for non-first messages
        window.dispatchEvent(new CustomEvent('badge-refresh-required', {
          detail: { immediate: true, forceTotalRecalculation: false }
        }));
      }
    }
  } catch (error) {
    console.error('[subscriptionHandlers] Error processing message:', error);
  }
};

export const handleMessageDeletion = (
  payload: RealtimePostgresChangesPayload<{
    [key: string]: any;
  }>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  try {
    const deletePayload = payload as unknown as DeletePayload;
    if (!deletePayload.old || !deletePayload.old.id || !deletePayload.old.club_id) {
      console.error('[subscriptionHandlers] Invalid delete payload:', payload);
      return;
    }
    
    const messageId = deletePayload.old.id;
    const clubId = deletePayload.old.club_id;
    
    console.log(`[subscriptionHandlers] Deleting message ${messageId} from club ${clubId}`);
    
    // Remove the message from the club's message list - use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
      setClubMessages((prevMessages) => {
        const clubMessages = prevMessages[clubId];
        
        if (!clubMessages) return prevMessages;
        
        return {
          ...prevMessages,
          [clubId]: clubMessages.filter(msg => msg.id !== messageId)
        };
      });
    });
  } catch (error) {
    console.error('[subscriptionHandlers] Error handling message deletion:', error);
  }
};

// Helper to manage prevMessages outside the handler
let prevMessages: Record<string, any[]> = {};

// Update the reference to prevMessages
export const setPrevMessages = (messages: Record<string, any[]>) => {
  prevMessages = messages;
};
