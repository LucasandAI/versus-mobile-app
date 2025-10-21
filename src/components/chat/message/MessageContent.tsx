import React from 'react';
import { ChatMessage } from '@/types/chat';

interface MessageContentProps {
  message: ChatMessage;
  isUserMessage: boolean;
  isSupport: boolean;
  onDeleteMessage?: () => void;
}

const MessageContent: React.FC<MessageContentProps> = ({
  message,
  isUserMessage,
  isSupport,
}) => {
  return (
    <div 
      className={`p-3 rounded-lg break-words ${
        isUserMessage 
          ? 'bg-primary text-white' 
          : isSupport
            ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-800'
      }`}
    >
      {message.text}
    </div>
  );
};

export default MessageContent;
