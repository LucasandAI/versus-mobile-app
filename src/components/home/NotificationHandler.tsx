
import React, { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { refreshNotifications } from '@/lib/notificationUtils';
import { useApp } from '@/context/AppContext';

interface NotificationHandlerProps {
  setChatNotifications: (count: number) => void;
  setNotifications: (notifications: any[]) => void;
}

const NotificationHandler: React.FC<NotificationHandlerProps> = ({
  setChatNotifications,
  setNotifications,
}) => {
  const { isSessionReady } = useApp();
  
  // Set up event listener to refresh notifications on focus
  useEffect(() => {
    if (!isSessionReady) return;
    
    console.log("[NotificationHandler] Setting up window focus handler");
    
    const handleWindowFocus = () => {
      console.log("[NotificationHandler] Window focused, refreshing notifications");
      refreshNotifications().then(notifications => {
        if (notifications && notifications.length > 0) {
          setNotifications(notifications);
        }
      }).catch(error => {
        console.error("[NotificationHandler] Error refreshing notifications:", error);
      });
    };
    
    window.addEventListener('focus', handleWindowFocus);
    
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isSessionReady, setNotifications]);

  // Set up the hooks for notifications
  useNotifications({ setNotifications });
  useChatNotifications({ setChatNotifications });

  return null;
};

export default NotificationHandler;
