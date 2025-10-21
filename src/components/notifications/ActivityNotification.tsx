
import React from 'react';
import { cn } from '@/lib/utils';

interface ActivityNotificationProps {
  userName: string;
  onUserClick: (userId: string, userName: string) => void;
  userId: string;
  distance: number;
  clubName: string;
  onClubClick: () => void;
  timestamp: string;
  formatTime: (timestamp: string) => string;
  isUnread: boolean;
}

export const ActivityNotification: React.FC<ActivityNotificationProps> = ({
  userName,
  onUserClick,
  userId,
  distance,
  clubName,
  onClubClick,
  timestamp,
  formatTime,
  isUnread,
}) => {
  return (
    <p className={cn("text-sm break-words", isUnread && "font-medium")}>
      <span 
        className="cursor-pointer hover:text-primary"
        onClick={() => onUserClick(userId, userName)}
      >
        {userName}
      </span>
      {' '}
      added{' '}
      <span className="font-medium">{distance.toFixed(1)}km</span>
      {' '}to{' '}
      <span 
        className="font-medium cursor-pointer hover:underline text-primary"
        onClick={onClubClick}
      >
        {clubName}
      </span>
      <br />
      <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>
    </p>
  );
};
