
import React from 'react';
import { Plus } from 'lucide-react';
import ConversationItem from './ConversationItem';
import { Button } from '@/components/ui/button';

export interface DMConversationListProps {
  conversations: Array<{
    conversationId: string;
    userId: string;
    userName: string;
    userAvatar?: string;
    lastMessage?: string | { text: string; timestamp: string };
    timestamp?: string;
  }>;
  onConversationSelect: (userId: string, userName: string, userAvatar?: string, conversationId?: string) => void;
  onNewChat: () => void;
  unreadConversations: Set<string>;
  selectedUserId: string;
}

const DMConversationList: React.FC<DMConversationListProps> = ({
  conversations,
  onConversationSelect,
  onNewChat,
  unreadConversations,
  selectedUserId
}) => {
  // Helper function to extract text from lastMessage whether it's string or object
  const getLastMessageText = (lastMessage?: string | { text: string; timestamp: string }): string => {
    if (!lastMessage) return '';
    return typeof lastMessage === 'string' ? lastMessage : lastMessage.text;
  };

  // Helper function to get timestamp
  const getTimestamp = (conversation: any): string => {
    if (conversation.timestamp) return conversation.timestamp;
    if (conversation.lastMessage && typeof conversation.lastMessage !== 'string') {
      return conversation.lastMessage.timestamp;
    }
    return '';
  };

  // Sort conversations by timestamp (most recent first)
  const sortedConversations = React.useMemo(() => {
    return [...conversations].sort((a, b) => {
      const timestampA = getTimestamp(a);
      const timestampB = getTimestamp(b);
      return new Date(timestampB).getTime() - new Date(timestampA).getTime();
    });
  }, [conversations]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold">Direct Messages</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="hover:bg-gray-100 rounded-full p-2"
          onClick={onNewChat}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sortedConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4 text-center">
            <p>No conversations yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={onNewChat}
            >
              Start a conversation
            </Button>
          </div>
        ) : (
          sortedConversations.map((conversation) => (
            <ConversationItem
              key={conversation.conversationId}
              id={conversation.conversationId}
              name={conversation.userName}
              avatar={conversation.userAvatar}
              lastMessage={
                typeof conversation.lastMessage === 'string' 
                  ? { 
                      text: conversation.lastMessage, 
                      timestamp: conversation.timestamp || new Date().toISOString() 
                    } 
                  : conversation.lastMessage || { 
                      text: 'No messages yet', 
                      timestamp: conversation.timestamp || new Date().toISOString() 
                    }
              }
              unread={unreadConversations.has(conversation.conversationId)}
              isActive={selectedUserId === conversation.userId}
              onClick={() => onConversationSelect(
                conversation.userId, 
                conversation.userName, 
                conversation.userAvatar,
                conversation.conversationId
              )}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default DMConversationList;
