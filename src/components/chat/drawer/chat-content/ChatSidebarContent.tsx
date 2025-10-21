
import React from 'react';
import { Club } from '@/types';
import ChatSidebar from '../../ChatSidebar';

interface ChatSidebarContentProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string) => void;
  unreadCounts?: Record<string, number>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
}

const ChatSidebarContent: React.FC<ChatSidebarContentProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  onDeleteChat,
  unreadCounts,
  onSelectUser,
}) => {
  return (
    <ChatSidebar
      clubs={clubs}
      selectedClub={selectedClub}
      onSelectClub={onSelectClub}
      onDeleteChat={onDeleteChat}
      unreadCounts={unreadCounts}
      onSelectUser={onSelectUser}
      activeTab="clubs"
    />
  );
};

export default ChatSidebarContent;
