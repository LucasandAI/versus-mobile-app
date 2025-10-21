
import React from 'react';
import { ChatMessage } from '@/types/chat';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: ChatMessage[];
  clubMembers: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  isSupport?: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
  formatTime: (isoString: string) => string;
  currentUserAvatar: string;
  currentUserId: string | null;
  lastMessageRef: React.RefObject<HTMLDivElement>;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  clubMembers,
  isSupport = false,
  onDeleteMessage,
  onSelectUser,
  formatTime,
  currentUserAvatar,
  currentUserId,
  lastMessageRef,
}) => {
  return (
    <div className="px-4 py-2 mb-0">
      {messages.length === 0 ? (
        <div className="h-full flex items-center justify-center text-gray-500 text-sm py-8">
          No messages yet. Start the conversation!
        </div>
      ) : (
        messages.map((message: ChatMessage, index: number) => {
          const isUserMessage = currentUserId && message.sender && 
            String(message.sender.id) === String(currentUserId);
          const isLastMessage = index === messages.length - 1;
          
          return (
            <div 
              key={message.id}
              ref={isLastMessage ? lastMessageRef : undefined}
              className={`${isLastMessage ? 'mb-1' : 'mb-4'}`}
            >
              <MessageItem
                message={message}
                isUserMessage={isUserMessage}
                isSupport={isSupport}
                onDeleteMessage={onDeleteMessage}
                onSelectUser={onSelectUser}
                formatTime={formatTime}
                currentUserAvatar={currentUserAvatar}
                isLastMessage={isLastMessage}
              />
            </div>
          );
        })
      )}
    </div>
  );
};

export default MessageList;
