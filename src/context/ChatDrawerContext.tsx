
import React, { createContext, useContext, useState, useCallback } from "react";

interface ChatDrawerContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const ChatDrawerContext = createContext<ChatDrawerContextType | undefined>(
  undefined
);

export const ChatDrawerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <ChatDrawerContext.Provider value={{ isOpen, open, close }}>
      {children}
    </ChatDrawerContext.Provider>
  );
};

export function useChatDrawerGlobal() {
  const ctx = useContext(ChatDrawerContext);
  if (!ctx)
    throw new Error(
      "useChatDrawerGlobal must be used within ChatDrawerProvider"
    );
  return ctx;
}
