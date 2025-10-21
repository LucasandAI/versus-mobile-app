import React from 'react';
import { Club } from '@/types';
import { useClubConversations, ClubConversation } from '@/hooks/chat/messages/useClubConversations';

interface ClubConversationsContextValue {
  clubConversations: ClubConversation[];
}

const ClubConversationsContext = React.createContext<ClubConversationsContextValue | undefined>(undefined);

export const ClubConversationsProvider: React.FC<{ clubs: Club[], children: React.ReactNode }> = ({ clubs, children }) => {
  const clubConversations = useClubConversations(clubs);
  return (
    <ClubConversationsContext.Provider value={{ clubConversations }}>
      {children}
    </ClubConversationsContext.Provider>
  );
};

export function useClubConversationsContext() {
  const ctx = React.useContext(ClubConversationsContext);
  if (!ctx) throw new Error('useClubConversationsContext must be used within a ClubConversationsProvider');
  return ctx;
} 