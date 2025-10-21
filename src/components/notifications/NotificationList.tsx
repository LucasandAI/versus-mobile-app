
import React from 'react';
import { format } from 'date-fns';
import { Notification } from '@/types';
import NotificationItem from './NotificationItem';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash } from 'lucide-react';

interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onUserClick: (userId: string, userName: string) => void;
  onDeclineInvite?: (id: string) => void;
  onClearAll: () => void;
  formatTime: (timestamp: string) => string;
  onOptimisticDelete?: (id: string) => void; // Prop for optimistic updates
}

export const NotificationList: React.FC<NotificationListProps> = ({
  notifications,
  onMarkAsRead,
  onUserClick,
  onDeclineInvite,
  onClearAll,
  formatTime,
  onOptimisticDelete
}) => {
  // Check if there are any unread notifications
  const hasUnread = notifications.some(notification => !notification.read);

  // Check if there are any notifications at all
  const isEmpty = notifications.length === 0;
  
  return (
    <div className="max-h-[80vh] flex flex-col">
      {/* List of notifications */}
      <div className="overflow-y-auto">
        {isEmpty ? (
          <div className="p-4 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem 
              key={notification.id} 
              notification={notification} 
              onMarkAsRead={onMarkAsRead} 
              onUserClick={onUserClick} 
              onDeclineInvite={onDeclineInvite} 
              formatTime={formatTime}
              onOptimisticDelete={onOptimisticDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};
