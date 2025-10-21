
import React from 'react';
import { ChatMessage } from '@/types/chat';
import UserAvatar from '@/components/shared/UserAvatar';
import MessageContent from './MessageContent';
import { supabase } from '@/integrations/supabase/client';
import MessageDeleteButton from './MessageDeleteButton';
import { useNavigation } from '@/hooks/useNavigation';

interface MessageItemProps {
  message: ChatMessage;
  isUserMessage: boolean;
  isSupport: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
  formatTime: (isoString: string) => string;
  currentUserAvatar: string;
  isLastMessage?: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isUserMessage,
  isSupport,
  onDeleteMessage,
  formatTime,
  currentUserAvatar,
  onSelectUser,
  isLastMessage = false
}) => {
  const [canDelete, setCanDelete] = React.useState(false);
  const { navigateToUserProfile } = useNavigation();
  
  React.useEffect(() => {
    const checkDeletePermission = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) return;
      
      const currentUserId = sessionData.session.user.id;
      const messageSenderId = message.sender?.id;
      
      if (currentUserId && messageSenderId) {
        setCanDelete(String(currentUserId) === String(messageSenderId));
      }
    };
    
    checkDeletePermission();
  }, [message.sender?.id]);
  
  const handleDeleteClick = (messageId: string) => {
    if (canDelete && onDeleteMessage && message.id) {
      console.log('[MessageItem] Delete button clicked for message:', message.id);
      onDeleteMessage(message.id);
    }
  };

  const handleProfileClick = () => {
    if (!isSupport && message.sender) {
      navigateToUserProfile(message.sender.id, message.sender.name, message.sender.avatar);
    }
  };

  const getTimestamp = () => {
    if (!message.timestamp) {
      console.warn('[MessageItem] Message has no timestamp:', message.id);
      return new Date().toISOString(); // Fallback to current time
    }
    return message.timestamp;
  };

  return (
    <div className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} ${isLastMessage ? 'mb-2' : 'mb-6'} group`}>
      {!isUserMessage && (
        <UserAvatar
          name={message.sender.name || "Unknown"}
          image={message.sender.avatar}
          size="sm"
          className={`flex-shrink-0 mr-2 ${!isSupport ? 'cursor-pointer hover:opacity-80' : ''}`}
          onClick={!isSupport ? handleProfileClick : undefined}
        />
      )}

      <div className={`flex flex-col ${isUserMessage ? 'items-end ml-auto' : 'items-start mr-2'} max-w-[75%]`}>
        {!isUserMessage && (
          <button
            className={`text-xs text-gray-500 mb-1 ${!isSupport ? 'cursor-pointer hover:text-primary' : ''} text-left w-full`}
            onClick={!isSupport ? handleProfileClick : undefined}
          >
            {message.sender.name || "Unknown"}
            {message.isSupport && <span className="ml-1 text-blue-500">(Support)</span>}
          </button>
        )}

        <MessageContent
          message={message}
          isUserMessage={isUserMessage}
          isSupport={isSupport}
        />

        <div className="text-xs text-gray-500 mt-1 pr-1 w-full text-left">
          {formatTime(getTimestamp())}
        </div>
      </div>

      {isUserMessage && !isSupport && (
        <div className="ml-2">
          <div className={`transition-opacity ${canDelete && onDeleteMessage ? 'opacity-0 group-hover:opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}> 
            <MessageDeleteButton messageId={message.id} onDelete={() => handleDeleteClick(message.id)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
