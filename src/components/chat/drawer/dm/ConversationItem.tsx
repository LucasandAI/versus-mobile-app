
import React from 'react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ConversationItemProps {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: {
    text: string;
    timestamp: string;
  };
  unread?: boolean;
  onClick: () => void;
  isActive?: boolean;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  name,
  avatar = "/placeholder.svg",
  lastMessage,
  unread = false,
  onClick,
  isActive = false
}) => {
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      
      if (isToday) {
        return format(date, 'h:mm a');
      } else {
        return format(date, 'MMM d');
      }
    } catch (error) {
      console.error('[ConversationItem] Error formatting time:', error);
      return '';
    }
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div 
      className={`flex items-center p-3 hover:bg-gray-100 cursor-pointer transition-colors ${
        isActive ? 'bg-gray-100' : ''
      }`}
      onClick={onClick}
    >
      <Avatar className="h-10 w-10 mr-3 flex-shrink-0">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-sm truncate">{name}</h3>
          {lastMessage?.timestamp && (
            <span className="text-xs text-gray-500 flex-shrink-0 ml-1">
              {formatTime(lastMessage.timestamp)}
            </span>
          )}
        </div>
        
        <div className="flex items-center">
          <p className="text-xs text-gray-500 truncate flex-1">
            {lastMessage?.text || 'No messages yet'}
          </p>
          {unread && (
            <span className="h-2 w-2 bg-primary rounded-full ml-1 flex-shrink-0"></span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationItem;
