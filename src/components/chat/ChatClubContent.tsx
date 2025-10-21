
import React, { useState, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import { Club } from '@/types';
import { useChatActions } from '@/hooks/chat/useChatActions';

interface ChatClubContentProps {
  club: Club;
  messages: any[];
  onMatchClick?: () => void;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onSendMessage: (message: string, clubId?: string) => void; 
  onDeleteMessage?: (messageId: string) => void;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  clubId?: string;
  globalMessages?: Record<string, any[]>;
}

const ChatClubContent: React.FC<ChatClubContentProps> = ({
  club,
  messages,
  onMatchClick,
  onSelectUser,
  onSendMessage,
  onDeleteMessage,
  setClubMessages,
  clubId,
  globalMessages
}) => {
  const { deleteMessage } = useChatActions();
  
  const handleDeleteMessage = async (messageId: string) => {
    if (onDeleteMessage) {
      await onDeleteMessage(messageId);
    } else if (setClubMessages) {
      await deleteMessage(messageId, setClubMessages);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader
        club={club}
        onSelectUser={onSelectUser}
        onClubClick={onMatchClick || (() => {})}
      />
      <ChatMessages 
        messages={messages} 
        clubMembers={club.members || []}
        onDeleteMessage={handleDeleteMessage}
        onSelectUser={onSelectUser}
      />
      <ChatInput onSendMessage={(message) => onSendMessage(message, club.id)} />
    </div>
  );
};

export default ChatClubContent;
