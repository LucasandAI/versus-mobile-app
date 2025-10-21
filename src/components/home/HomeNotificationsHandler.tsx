
import React, { useEffect } from 'react';
import { Club } from '@/types';
import HomeNotifications from './HomeNotifications';
import ChatDrawerHandler from './ChatDrawerHandler';
import { useHomeNotifications } from '@/hooks/home/useHomeNotifications';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

interface HomeNotificationsHandlerProps {
  userClubs: Club[];
  onJoinClub: (clubId: string, clubName: string) => void;
  onSelectUser: (userId: string, name: string) => void;
}

const HomeNotificationsHandler: React.FC<HomeNotificationsHandlerProps> = ({
  userClubs,
  onJoinClub,
  onSelectUser
}) => {
  const { currentUser } = useApp();
  const {
    notifications,
    setNotifications,
    updateUnreadCount,
    handleMarkAsRead,
    handleDeclineInvite,
    handleClearAllNotifications
  } = useHomeNotifications();

  // Log user auth status
  useEffect(() => {
    const checkAuthUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      console.log("[HomeNotificationsHandler] Current authenticated user:", data.user?.id);
      if (error) {
        console.error("[HomeNotificationsHandler] Auth error:", error);
      }
    };
    checkAuthUser();
  }, []);

  // Log notifications state
  useEffect(() => {
    console.log("[HomeNotificationsHandler] Current notifications state:", 
      notifications.length, notifications);
  }, [notifications]);

  // Listen for real-time chat messages
  useEffect(() => {
    if (!currentUser) return;
    
    // Subscribe to club messages for the user's clubs
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages',
          filter: `club_id=in.(${userClubs.map(club => `'${club.id}'`).join(',')})` 
        },
        (payload) => {
          if (payload.new.sender_id !== currentUser.id) {
            // Update unread count if the message is not from current user
            const clubId = payload.new.club_id;
            
            // Dispatch event to update unread messages
            const event = new CustomEvent('unreadMessagesUpdated', { 
              detail: { clubId }
            });
            window.dispatchEvent(event);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, userClubs]);

  return (
    <>
      <HomeNotifications
        setChatNotifications={updateUnreadCount}
        setNotifications={setNotifications}
      />

      <ChatDrawerHandler 
        userClubs={userClubs}
        onSelectUser={onSelectUser}
      />
    </>
  );
};

export default HomeNotificationsHandler;
