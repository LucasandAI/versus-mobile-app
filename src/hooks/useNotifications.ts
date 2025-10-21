
import { useEffect } from 'react';
import { Notification } from '@/types';
import { getNotificationsFromStorage } from '@/lib/notificationUtils';

interface UseNotificationsProps {
  setNotifications: (notifications: Notification[]) => void;
}

export const useNotifications = ({ setNotifications }: UseNotificationsProps) => {
  useEffect(() => {
    // Function to load notifications from localStorage
    const loadNotificationsFromStorage = () => {
      console.log("[useNotifications] Loading notifications from storage");
      const notifications = getNotificationsFromStorage();
      console.log("[useNotifications] Loaded notifications:", notifications.length, notifications);
      if (notifications.length > 0) {
        setNotifications(notifications);
      } else {
        console.log("[useNotifications] No notifications found in storage or empty array");
      }
    };

    // Listen for notification updates
    const handleNotificationsUpdated = () => {
      console.log("[useNotifications] Notification update event received");
      loadNotificationsFromStorage();
    };
    
    // Add event listeners for updates
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    
    // Initial load from storage
    loadNotificationsFromStorage();
    
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [setNotifications]);
};
