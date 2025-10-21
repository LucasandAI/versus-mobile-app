import React from 'react';
import { Club } from '@/types';
import { useClubMessages } from '@/hooks/chat/useClubMessages';

interface ClubMessagesContextValue {
  clubMessages: Record<string, any[]>;
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
}

const ClubMessagesContext = React.createContext<ClubMessagesContextValue | undefined>(undefined);

export const ClubMessagesProvider: React.FC<{ clubs: Club[], isOpen: boolean, children: React.ReactNode }> = ({ clubs, isOpen, children }) => {
  const { clubMessages, setClubMessages } = useClubMessages(clubs, isOpen);
  return (
    <ClubMessagesContext.Provider value={{ clubMessages, setClubMessages }}>
      {children}
    </ClubMessagesContext.Provider>
  );
};

export function useClubMessagesContext() {
  const ctx = React.useContext(ClubMessagesContext);
  if (!ctx) throw new Error('useClubMessagesContext must be used within a ClubMessagesProvider');
  return ctx;
} 