import { supabase } from '@/integrations/supabase/client';
import { DMConversation } from '../types';
import { toast } from '@/hooks/use-toast';

// Fetch basic conversation data from Supabase
export const fetchBasicConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('direct_conversations')
    .select('id, user1_id, user2_id, created_at')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

  if (error) throw error;

  // Filter out self-conversations where user1_id === user2_id
  return (data || []).filter(conv => 
    conv.user1_id !== conv.user2_id && 
    (conv.user1_id === userId || conv.user2_id === userId)
  );
};

// Extract user IDs for the other participants
export const extractOtherUserIds = (conversations: any[], currentUserId: string) => {
  const otherIds = new Set<string>();
  
  conversations.forEach(conv => {
    const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
    if (otherUserId !== currentUserId) {
      otherIds.add(otherUserId);
    }
  });
  
  return Array.from(otherIds);
};

// Create initial conversation objects with minimal data
export const createBasicConversationObjects = (conversations: any[], currentUserId: string) => {
  const basicConversations: Record<string, DMConversation> = {};
  
  conversations.forEach(conv => {
    const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
    
    // Skip self-conversations
    if (otherUserId === currentUserId) return;
    
    basicConversations[conv.id] = {
      conversationId: conv.id,
      userId: otherUserId,
      userName: 'Loading...',
      userAvatar: '/placeholder.svg',
      lastMessage: '',
      timestamp: conv.created_at
    };
  });
  
  return basicConversations;
};

// Build a map of user information for quick lookup
export const createUserMap = (users: any[]): Record<string, any> => {
  return users.reduce((acc: Record<string, any>, user) => {
    acc[user.id] = user;
    return acc;
  }, {});
};

// Create a map of the latest messages for each conversation
export const createLatestMessageMap = (messages: any[]): Record<string, any> => {
  const latestMessages: Record<string, any> = {};
  
  messages.forEach(msg => {
    const convId = msg.conversation_id;
    if (!latestMessages[convId] || new Date(msg.timestamp) > new Date(latestMessages[convId].timestamp)) {
      latestMessages[convId] = msg;
    }
  });
  
  return latestMessages;
};

// Build the final conversation objects with all available data
export const buildFinalConversations = (
  conversations: any[],
  currentUserId: string,
  userMap: Record<string, any>,
  latestMessageMap: Record<string, any>
) => {
  return conversations.map(conv => {
    const otherUserId = conv.user1_id === currentUserId ? conv.user2_id : conv.user1_id;
    
    // Skip self-conversations
    if (otherUserId === currentUserId) return null;
    
    const user = userMap[otherUserId] || { name: 'Unknown User', avatar: '/placeholder.svg' };
    const latestMessage = latestMessageMap[conv.id];
    
    return {
      conversationId: conv.id,
      userId: otherUserId,
      userName: user.name,
      userAvatar: user.avatar || '/placeholder.svg',
      lastMessage: latestMessage && typeof latestMessage.text === 'string' ? latestMessage.text : '',
      timestamp: latestMessage ? latestMessage.timestamp : conv.created_at
    };
  }).filter(Boolean); // Filter out any null entries (self-conversations)
};

// Add a helper function for showing error toasts (prevents duplicates)
export const showErrorToast = (message: string, hasShownToast: boolean): boolean => {
  if (hasShownToast) return true;
  
  toast({
    title: "Error",
    description: message,
    variant: "destructive"
  });
  
  return true;
};
