
import { createContext, useContext } from 'react';
import { UnreadMessagesContextType } from './types';

// Create a context with a default value
const UnreadMessagesContext = createContext<UnreadMessagesContextType>({
  totalUnreadCount: 0,
  clubUnreadCounts: {},
  directMessageUnreadCounts: {},
  refreshUnreadCounts: async () => {},
  
  // Add default values for all required properties
  unreadConversations: new Set<string>(),
  unreadClubs: new Set<string>(),
  markClubMessagesAsRead: async () => {},
  markDirectConversationAsRead: async () => {},
  markConversationAsRead: async () => {}, // Added missing method
  fetchUnreadCounts: async () => {},
  
  // Properties from original interface
  unreadClubMessages: new Set<string>(),
  unreadDirectMessageConversations: new Set<string>(),
  unreadMessagesCount: 0
});

// Export a hook to use this context
export const useUnreadMessages = () => {
  const context = useContext(UnreadMessagesContext);
  
  if (!context) {
    throw new Error('useUnreadMessages must be used within an UnreadMessagesProvider');
  }
  
  return context;
};

export default UnreadMessagesContext;
