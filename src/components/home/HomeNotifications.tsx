
import React from 'react';
import { useUnreadMessages } from '@/context/unread-messages';
import { useChatNotifications } from '@/hooks/useChatNotifications';

interface HomeNotificationsProps {
  setChatNotifications: (count: number) => void;
  setNotifications: React.Dispatch<React.SetStateAction<any[]>>;
}

const HomeNotifications: React.FC<HomeNotificationsProps> = ({
  setChatNotifications,
  setNotifications
}) => {
  // Use the unread messages context to get the total count
  const { totalUnreadCount } = useUnreadMessages();
  
  // Update the chat notification count using our hook
  useChatNotifications({ setChatNotifications });

  return null; // This component doesn't render anything, it just handles state updates
};

export default HomeNotifications;
