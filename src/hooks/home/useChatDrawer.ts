
import { useState } from 'react';

export const useChatDrawer = () => {
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);

  const openChatDrawer = () => {
    setChatDrawerOpen(true);
  };

  const closeChatDrawer = () => {
    setChatDrawerOpen(false);
    // Dispatch event for other components to react to drawer closing
    const event = new CustomEvent('chatDrawerClosed');
    window.dispatchEvent(event);
  };

  return {
    chatDrawerOpen,
    setChatDrawerOpen,
    openChatDrawer,
    closeChatDrawer,
  };
};
