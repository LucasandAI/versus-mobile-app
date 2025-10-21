
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell, Trash } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NotificationList } from '../notifications/NotificationList';
import { Notification } from '@/types';
import { markAllNotificationsAsRead } from '@/lib/notificationUtils';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';
import { useInitialAppLoad } from '@/hooks/useInitialAppLoad';

interface NotificationPopoverProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onUserClick: (userId: string, userName: string) => void;
  onDeclineInvite?: (notificationId: string) => void;
}

const NotificationPopover: React.FC<NotificationPopoverProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onUserClick,
  onDeclineInvite
}) => {
  const { isSessionReady } = useApp();
  const isAppReady = useInitialAppLoad();
  const [open, setOpen] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications);

  // Update local state when props change
  useEffect(() => {
    setLocalNotifications(notifications);
  }, [notifications]);

  // Listen for notification updates from other parts of the app
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      // This will be handled by the parent component which will refetch notifications
      // and pass them down as props, triggering the useEffect above
      console.log("[NotificationPopover] Received notificationsUpdated event");
    };
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, []);

  // Count notifications that haven't been read yet
  const unreadCount = localNotifications.filter(n => !n.read).length;
  console.log("[NotificationPopover] Rendering with notifications:", localNotifications.length, "Unread count:", unreadCount);

  // When the popover opens, mark all notifications as read
  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);

    // Only try to mark notifications as read when app is ready
    if (isOpen && unreadCount > 0 && isAppReady && isSessionReady) {
      console.log("[NotificationPopover] Marking all notifications as read");
      await markAllNotificationsAsRead();
    }
  };

  // Handle optimistic UI updates for notification deletion
  const handleOptimisticDelete = (id: string) => {
    console.log("[NotificationPopover] Optimistically removing notification:", id);
    setLocalNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Handle clearing all notifications
  const handleClearAll = async () => {
    if (localNotifications.length === 0) return;
    console.log("[NotificationPopover] Clearing all notifications");

    // Save current notifications for potential restoration
    const previousNotifications = [...localNotifications];

    // Optimistically update UI first
    setLocalNotifications([]);
    try {
      // Get current user
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Delete all notifications for this user from database
      const {
        error
      } = await supabase.from('notifications').delete().eq('user_id', user.id);
      if (error) {
        throw error;
      }

      // If successful, update localStorage as well
      localStorage.setItem('notifications', JSON.stringify([]));

      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));

      // Call the parent component's onClearAll handler
      onClearAll();
      toast.success("All notifications cleared");
    } catch (error) {
      console.error("[NotificationPopover] Error clearing notifications:", error);

      // Restore the previous state on error
      setLocalNotifications(previousNotifications);
      toast.error("Failed to clear notifications");

      // Refresh notifications from server
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    }
  };

  // Helper function to format notification timestamps
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative text-primary hover:bg-gray-100 rounded-full p-2">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="dot" 
              className="absolute -top-1 -right-0.5"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 max-w-[90vw]" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex gap-2">
            {localNotifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-red-500 hover:text-red-700 flex items-center" 
                onClick={handleClearAll}
              >
                <Trash className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </div>
        <NotificationList 
          notifications={localNotifications} 
          onMarkAsRead={onMarkAsRead} 
          onUserClick={onUserClick} 
          onDeclineInvite={onDeclineInvite} 
          onClearAll={onClearAll} 
          formatTime={formatTime} 
          onOptimisticDelete={handleOptimisticDelete} 
        />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationPopover;
