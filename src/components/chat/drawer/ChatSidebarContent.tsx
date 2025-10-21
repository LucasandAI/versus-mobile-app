import React from 'react';
import { Club } from '@/types';
import ChatSidebar from '../ChatSidebar';
import { ClubConversationsProvider } from '@/context/ClubConversationsContext';

interface ChatSidebarContentProps {
  clubs: Club[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  onDeleteChat?: (chatId: string) => void;
  unreadCounts?: Record<string, number>;
  unreadClubs?: Set<string>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  activeTab: "clubs" | "dm";
}

const ChatSidebarContent: React.FC<ChatSidebarContentProps> = ({
  clubs,
  selectedClub,
  onSelectClub,
  onDeleteChat,
  unreadCounts,
  unreadClubs = new Set(),
  onSelectUser,
  activeTab
}) => {
  // Create a key for forced re-renders
  const unreadKey = JSON.stringify([...unreadClubs].sort());
  
  return (
    <ClubConversationsProvider clubs={clubs}>
      <div className="h-full flex flex-col overflow-hidden">
        <ChatSidebar
          key={`chat-sidebar-${unreadKey}`}
          clubs={clubs}
          selectedClub={selectedClub}
          onSelectClub={onSelectClub}
          onDeleteChat={onDeleteChat}
          unreadCounts={unreadCounts}
          unreadClubs={unreadClubs}
          onSelectUser={onSelectUser}
          activeTab={activeTab}
        />
      </div>
    </ClubConversationsProvider>
  );
};

export default ChatSidebarContent;
