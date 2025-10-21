import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { Notification } from '@/types';
import { handleNotification, markAllNotificationsAsRead } from '@/lib/notificationUtils';
import { useInitialAppLoad } from '@/hooks/useInitialAppLoad';

export const useHomeNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadMessages, setUnreadMessages] = useState<Record<string, number>>({});
  const { currentUser, refreshCurrentUser } = useApp();
  const isAppReady = useInitialAppLoad();  // NEW: Get app ready state

  // Initialize notifications from localStorage if available
  useEffect(() => {
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsedNotifications = JSON.parse(storedNotifications);
        console.log('[useHomeNotifications] Initialized from localStorage:', parsedNotifications.length, parsedNotifications);
        setNotifications(parsedNotifications);
      } catch (error) {
        console.error('[useHomeNotifications] Error parsing stored notifications:', error);
      }
    }
  }, []);

  // Listen for the userDataUpdated event to refresh data
  useEffect(() => {
    const handleUserDataUpdate = () => {
      console.log('[useHomeNotifications] User data update detected, refreshing user data');
      if (refreshCurrentUser) {
        refreshCurrentUser().catch(err => {
          console.error('[useHomeNotifications] Error refreshing user data:', err);
        });
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, [refreshCurrentUser]);
  
  // Set up real-time listener for notifications table - NOW RESPECTS APP READY STATE
  useEffect(() => {
    // Don't set up subscription until app is ready and user is authenticated
    if (!isAppReady || !currentUser?.id) {
      console.log('[useHomeNotifications] App not ready or no current user, skipping real-time subscription');
      return;
    }
    
    console.log('[useHomeNotifications] Setting up real-time subscription for notifications');
    
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('[useHomeNotifications] Notification change detected:', payload);
          
          // Handle INSERT events
          if (payload.eventType === 'INSERT') {
            const newNotification = formatNotificationFromPayload(payload.new);
            if (newNotification) {
              console.log('[useHomeNotifications] Adding new notification:', newNotification);
              
              // Update state (prepend to keep newest first)
              setNotifications(prev => {
                // Check if this notification already exists (avoid duplicates)
                const exists = prev.some(n => n.id === newNotification.id);
                if (exists) return prev;
                
                const updated = [newNotification, ...prev];
                
                // Update localStorage
                localStorage.setItem('notifications', JSON.stringify(updated));
                
                return updated;
              });
            }
          }
          
          // Handle DELETE events
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              console.log('[useHomeNotifications] Removing deleted notification:', deletedId);
              
              setNotifications(prev => {
                const updated = prev.filter(n => n.id !== deletedId);
                
                // Update localStorage
                localStorage.setItem('notifications', JSON.stringify(updated));
                
                return updated;
              });
            }
          }
          
          // Handle UPDATE events (e.g., marking as read)
          if (payload.eventType === 'UPDATE') {
            const updatedNotification = formatNotificationFromPayload(payload.new);
            if (updatedNotification) {
              console.log('[useHomeNotifications] Updating notification:', updatedNotification);
              
              setNotifications(prev => {
                const updated = prev.map(n => 
                  n.id === updatedNotification.id ? updatedNotification : n
                );
                
                // Update localStorage
                localStorage.setItem('notifications', JSON.stringify(updated));
                
                return updated;
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('[useHomeNotifications] Real-time subscription status:', status);
      });
      
    return () => {
      console.log('[useHomeNotifications] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isAppReady]); // Added isAppReady dependency

  // Helper function to format notification from Supabase payload
  const formatNotificationFromPayload = (data: any): Notification | null => {
    if (!data) return null;
    
    return {
      id: data.id,
      type: data.type,
      userId: data.user_id,
      clubId: data.club_id,
      clubName: data.data?.clubName || 'Unknown Club',
      clubLogo: data.data?.clubLogo || null,
      title: data.title || '',
      message: data.message || '',
      timestamp: data.created_at,
      read: data.read || false,
      data: data.data || {}
    };
  };

  const handleMarkAsRead = useCallback(async (id: string) => {
    try {
      console.log('[useHomeNotifications] Marking notification as read:', id);
      if (!currentUser?.id) {
        console.log('[useHomeNotifications] No current user, skipping');
        return;
      }

      // Update local state optimistically
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
      
      // Update in database and localStorage
      const updatedNotifications = await handleNotification(id, 'read');
      if (!updatedNotifications) {
        // Revert optimistic update on failure
        console.error('[useHomeNotifications] Failed to mark notification as read');
        toast.error("Failed to mark notification as read");
      }
    } catch (error) {
      console.error("[useHomeNotifications] Error marking notification as read:", error);
      toast.error("Failed to mark notification as read");
    }
  }, [notifications, currentUser?.id]);

  const handleDeclineInvite = useCallback(async (id: string) => {
    try {
      console.log('[useHomeNotifications] Decline notification:', id);
      if (!currentUser?.id) {
        console.log('[useHomeNotifications] No current user, skipping');
        return;
      }
      
      // For non-join-request notifications, just delete the notification
      const notification = notifications.find(n => n.id === id);
      if (!notification) {
        throw new Error("Invalid notification data");
      }
      
      if (notification.type !== 'join_request') {
        // Delete the notification
        await handleNotification(id, 'delete');
        
        // Update local state
        setNotifications(prev => prev.filter(notification => notification.id !== id));
        
        toast.success("Notification removed");
      } else {
        // For join requests, the actual functionality is now in NotificationItem component
        // We just remove it from UI here if needed
        setNotifications(prev => prev.filter(notification => notification.id !== id));
      }
    } catch (error) {
      console.error("[useHomeNotifications] Error declining notification:", error);
      toast.error("Failed to process notification");
    }
  }, [notifications, currentUser?.id]);

  const handleClearAllNotifications = useCallback(async () => {
    try {
      console.log('[useHomeNotifications] Clearing all notifications');
      if (!currentUser?.id) {
        console.log('[useHomeNotifications] No current user, skipping');
        return;
      }
      
      // Mark all notifications as read in database and localStorage
      const updatedNotifications = await markAllNotificationsAsRead();
      
      // Update local state
      if (updatedNotifications) {
        setNotifications(updatedNotifications);
        toast.success("All notifications cleared");
      }
    } catch (error) {
      console.error("[useHomeNotifications] Error clearing notifications:", error);
      toast.error("Failed to clear notifications");
    }
  }, [currentUser?.id]);

  // Define the updateUnreadCount function with the proper signature
  const updateUnreadCount = useCallback((count: number) => {
    console.log('[useHomeNotifications] Updating unread count:', count);
    // We need to convert our count number to update the unreadMessages object
    const unreadMessagesCounts = localStorage.getItem('unreadMessages');
    try {
      const parsed = unreadMessagesCounts ? JSON.parse(unreadMessagesCounts) : {};
      const totalCount = Object.values(parsed).reduce((sum: number, val: any) => 
        sum + (typeof val === 'number' ? val : 0), 0);
      
      if (totalCount !== count) {
        // Just dispatch an event to notify handlers that unread messages updated
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      }
    } catch (e) {
      console.error("[useHomeNotifications] Error parsing unread messages:", e);
    }
  }, []);

  return {
    notifications,
    setNotifications,
    unreadMessages,
    setUnreadMessages,
    updateUnreadCount,
    handleMarkAsRead: useCallback(async (id: string) => {
      try {
        console.log('[useHomeNotifications] Marking notification as read:', id);
        if (!currentUser?.id) {
          console.log('[useHomeNotifications] No current user, skipping');
          return;
        }

        // Update local state optimistically
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id ? { ...notification, read: true } : notification
          )
        );
        
        // Update in database and localStorage
        const updatedNotifications = await handleNotification(id, 'read');
        if (!updatedNotifications) {
          // Revert optimistic update on failure
          console.error('[useHomeNotifications] Failed to mark notification as read');
          toast.error("Failed to mark notification as read");
        }
      } catch (error) {
        console.error("[useHomeNotifications] Error marking notification as read:", error);
        toast.error("Failed to mark notification as read");
      }
    }, [notifications, currentUser?.id]),
    handleDeclineInvite: useCallback(async (id: string) => {
      try {
        console.log('[useHomeNotifications] Decline notification:', id);
        if (!currentUser?.id) {
          console.log('[useHomeNotifications] No current user, skipping');
          return;
        }
        
        // For non-join-request notifications, just delete the notification
        const notification = notifications.find(n => n.id === id);
        if (!notification) {
          throw new Error("Invalid notification data");
        }
        
        if (notification.type !== 'join_request') {
          // Delete the notification
          await handleNotification(id, 'delete');
          
          // Update local state
          setNotifications(prev => prev.filter(notification => notification.id !== id));
          
          toast.success("Notification removed");
        } else {
          // For join requests, the actual functionality is now in NotificationItem component
          // We just remove it from UI here if needed
          setNotifications(prev => prev.filter(notification => notification.id !== id));
        }
      } catch (error) {
        console.error("[useHomeNotifications] Error declining notification:", error);
        toast.error("Failed to process notification");
      }
    }, [notifications, currentUser?.id]),
    handleClearAllNotifications: useCallback(async () => {
      try {
        console.log('[useHomeNotifications] Clearing all notifications');
        if (!currentUser?.id) {
          console.log('[useHomeNotifications] No current user, skipping');
          return;
        }
        
        // Mark all notifications as read in database and localStorage
        const updatedNotifications = await markAllNotificationsAsRead();
        
        // Update local state
        if (updatedNotifications) {
          setNotifications(updatedNotifications);
          toast.success("All notifications cleared");
        }
      } catch (error) {
        console.error("[useHomeNotifications] Error clearing notifications:", error);
        toast.error("Failed to clear notifications");
      }
    }, [currentUser?.id])
  };
};
