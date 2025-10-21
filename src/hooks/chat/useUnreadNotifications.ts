
import { useState, useCallback, useEffect } from 'react';

export const useUnreadNotifications = (
  open: boolean, 
  onNewMessage?: (count: number) => void
) => {
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});

  const updateUnreadCount = useCallback((chatId: string, increment: number) => {
    setUnreadMessages(prev => {
      const updated = { 
        ...prev, 
        [chatId]: (prev[chatId] || 0) + increment 
      };
      localStorage.setItem('unreadMessages', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Reset notification count when drawer is open
  useEffect(() => {
    if (open) {
      const savedUnread = localStorage.getItem('unreadMessages');
      if (savedUnread) {
        setUnreadMessages(JSON.parse(savedUnread));
      }
    }
  }, [open]);

  // Update notification count when unread messages change
  useEffect(() => {
    if (onNewMessage) {
      const totalUnread = Object.values(unreadMessages).reduce(
        (sum: number, count: unknown) => sum + (typeof count === 'number' ? count : 0),
        0
      );
      onNewMessage(totalUnread);
    }
  }, [unreadMessages, onNewMessage]);

  return {
    unreadMessages,
    setUnreadMessages,
    updateUnreadCount
  };
};
