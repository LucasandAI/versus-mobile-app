
import React, { useState } from 'react';
import { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApp } from '@/context/AppContext';
import { acceptClubInvite, denyClubInvite } from '@/utils/clubInviteActions';
import { acceptJoinRequest, denyJoinRequest } from '@/utils/joinRequestUtils';
import { useClubNavigation } from '@/hooks/useClubNavigation';
import { useUserNavigation } from '@/hooks/navigation/useUserNavigation';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onUserClick: (userId: string, userName: string) => void;
  onDeclineInvite?: (notificationId: string) => void;
  onOptimisticDelete?: (notificationId: string) => void;
  formatTime: (timestamp: string) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onUserClick,
  onDeclineInvite,
  onOptimisticDelete,
  formatTime
}) => {
  const { currentUser } = useApp();
  const { navigateToClub } = useClubNavigation();
  const { navigateToUserProfile } = useUserNavigation();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUserClick = (userId: string, userName: string) => {
    console.log(`[NotificationItem] Opening profile for user: ${userName} (${userId})`);
    navigateToUserProfile(userId, userName);
  };

  const handleClubClick = async (clubId: string, clubName: string) => {
    console.log(`[NotificationItem] Navigating to club: ${clubName} (${clubId})`);
    // Use the standard navigation which will properly fetch complete club data
    navigateToClub({ id: clubId, name: clubName });
  };

  const handleMarkAsRead = async (id: string) => {
    console.log(`[NotificationItem] Marking notification as read: ${id}`);
    onMarkAsRead(id);
  };

  const getActionButtons = () => {
    if (isProcessing) {
      return (
        <Button variant="secondary" size="sm" disabled>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading
        </Button>
      );
    }

    switch (notification.type) {
      case 'invite':
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDeclineInvite}>
              <X className="mr-2 h-4 w-4" />
              Decline
            </Button>
            <Button size="sm" onClick={handleAcceptInvite}>
              <Check className="mr-2 h-4 w-4" />
              Accept
            </Button>
          </div>
        );
      case 'join_request':
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDenyJoinRequest}>
              <X className="mr-2 h-4 w-4" />
              Decline
            </Button>
            <Button size="sm" onClick={handleAcceptJoinRequest}>
              <Check className="mr-2 h-4 w-4" />
              Accept
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  const handleAcceptInvite = async () => {
    if (!notification.clubId || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await acceptClubInvite(
        notification.id,
        notification.clubId,
        currentUser?.id || ''
      );
      
      if (success && onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
    } catch (error) {
      console.error('Error accepting invite:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineInvite = async () => {
    if (!notification.clubId || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await denyClubInvite(
        notification.id,
        notification.clubId,
        currentUser?.id || ''
      );
      
      if (success && onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
    } catch (error) {
      console.error('Error declining invite:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptJoinRequest = async () => {
    if (!notification.data?.userId || !notification.clubId || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await acceptJoinRequest(
        notification.data.userId,
        notification.clubId,
        notification.data.userName || 'Unknown User'
      );
      
      if (success && onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
    } catch (error) {
      console.error('Error accepting join request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDenyJoinRequest = async () => {
    if (!notification.data?.userId || !notification.clubId || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const success = await denyJoinRequest(
        notification.data.userId,
        notification.clubId
      );
      
      if (success && onOptimisticDelete) {
        onOptimisticDelete(notification.id);
      }
    } catch (error) {
      console.error('Error denying join request:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render message with clickable club names and usernames
  const renderMessage = () => {
    let message = notification.message;
    
    // Handle invite notifications - make club name clickable
    if (notification.type === 'invite' && notification.data?.clubName && notification.data?.clubId) {
      const clubName = notification.data.clubName;
      const clubId = notification.data.clubId;
      
      return (
        <div className="text-sm">
          You've been invited to join{' '}
          <span
            className="text-green-600 hover:text-green-800 cursor-pointer font-medium"
            onClick={() => handleClubClick(clubId, clubName)}
          >
            {clubName}
          </span>
          .
        </div>
      );
    }
    
    // Handle request_accepted notifications - make club name clickable
    if (notification.type === 'request_accepted' && notification.data?.clubName && notification.data?.clubId) {
      const clubName = notification.data.clubName;
      const clubId = notification.data.clubId;
      
      return (
        <div className="text-sm">
          You've been added to{' '}
          <span
            className="text-green-600 hover:text-green-800 cursor-pointer font-medium"
            onClick={() => handleClubClick(clubId, clubName)}
          >
            {clubName}
          </span>
          .
        </div>
      );
    }
    
    // Handle join_request notifications - make both username AND club name clickable
    if (notification.type === 'join_request' && notification.data?.userName && notification.data?.userId) {
      const userName = notification.data.userName;
      const userId = notification.data.userId;
      const clubName = notification.data?.clubName || 'the club';
      const clubId = notification.data?.clubId || notification.clubId;
      
      return (
        <div className="text-sm">
          <span
            className="text-green-600 hover:text-green-800 cursor-pointer font-medium"
            onClick={() => handleUserClick(userId, userName)}
          >
            {userName}
          </span>
          {' '}has requested to join{' '}
          {clubId ? (
            <span
              className="text-green-600 hover:text-green-800 cursor-pointer font-medium"
              onClick={() => handleClubClick(clubId, clubName)}
            >
              {clubName}
            </span>
          ) : (
            clubName
          )}
        </div>
      );
    }
    
    // For other notification types, display the message as-is
    return <div className="text-sm">{message}</div>;
  };

  return (
    <div className="p-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Message content with clickable elements */}
          {renderMessage()}
          
          {/* Timestamp */}
          <div className="text-xs text-gray-500 mt-1">
            {formatTime(notification.timestamp)}
          </div>
          
          {/* Action buttons */}
          <div className="mt-2">
            {getActionButtons()}
          </div>
        </div>
        
        {/* Unread indicator */}
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
