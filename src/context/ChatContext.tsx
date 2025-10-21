
import React, { createContext, useContext, useState } from 'react';
import { Club } from '@/types';

interface ChatContextType {
  selectedClub: Club | null;
  setSelectedClub: (club: Club | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  return (
    <ChatContext.Provider value={{
      selectedClub,
      setSelectedClub,
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
