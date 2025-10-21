
export interface UnreadMessagesContextType {
  unreadClubMessages: Set<string>;
  unreadDirectMessageConversations: Set<string>;
  markClubMessagesAsRead: (clubId: string) => Promise<void>;
  markDirectConversationAsRead: (conversationId: string) => Promise<void>;
  unreadMessagesCount: number;
  
  // Add missing properties
  unreadConversations: Set<string>;
  unreadClubs: Set<string>;
  totalUnreadCount: number;
  clubUnreadCounts: Record<string, number>;
  directMessageUnreadCounts: Record<string, number>;
  refreshUnreadCounts: () => Promise<void>;
  fetchUnreadCounts: () => Promise<void>;
  
  // Renamed property to match implementation
  markConversationAsRead: (conversationId: string) => Promise<void>;
}
