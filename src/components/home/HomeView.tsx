import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import CreateClubDialog from '../club/CreateClubDialog';
import SearchClubDialog from '../club/SearchClubDialog';
import HomeHeader from './HomeHeader';
import HomeClubsSection from './HomeClubsSection';
import HomeNotificationsHandler from './HomeNotificationsHandler';
import { useClubActions } from '@/hooks/home/useClubActions';
import { useHomeNotifications } from '@/hooks/home/useHomeNotifications';
import { ChatDrawerProvider } from '@/context/ChatDrawerContext';
import { UnreadMessagesProvider } from '@/context/UnreadMessagesContext';
import ChatDrawerHandler from './ChatDrawerHandler';

interface HomeViewProps {
  chatNotifications?: number;
}

const HomeView: React.FC<HomeViewProps> = ({ chatNotifications = 0 }) => {
  const { setCurrentView, setSelectedClub, setSelectedUser, currentUser, refreshCurrentUser } = useApp();
  
  const {
    searchDialogOpen,
    setSearchDialogOpen,
    createClubDialogOpen,
    setCreateClubDialogOpen,
    handleRequestToJoin,
    handleJoinClub,
    availableClubs
  } = useClubActions();

  const {
    notifications,
    handleMarkAsRead,
    handleDeclineInvite,
    handleClearAllNotifications
  } = useHomeNotifications();

  useEffect(() => {
    if (currentUser && (!currentUser.clubs || currentUser.clubs.length === 0)) {
      console.log('[HomeView] No clubs found on initial render, refreshing user data');
      refreshCurrentUser().catch(error => {
        console.error('[HomeView] Error refreshing user data:', error);
      });
    } else {
      console.log('[HomeView] User has clubs on initial render:', currentUser?.clubs?.length || 0);
    }
  }, [currentUser, refreshCurrentUser]);

  const handleSelectClub = (club: Club) => {
    setSelectedClub(club);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, name: string, avatar?: string) => {
    setSelectedUser({
      id: userId,
      name: name,
      avatar: avatar || '/placeholder.svg',
      clubs: []
    });
    setCurrentView('profile');
  };

  const userClubs = currentUser?.clubs || [];

  return (
    <UnreadMessagesProvider>
      <ChatDrawerProvider>
        <div className="pb-20 pt-20">
          <HomeNotificationsHandler 
            userClubs={userClubs}
            onJoinClub={handleJoinClub}
            onSelectUser={handleSelectUser}
          />
          
          <HomeHeader 
            notifications={notifications}
            onMarkAsRead={handleMarkAsRead}
            onClearAll={handleClearAllNotifications}
            onUserClick={handleSelectUser}
            onDeclineInvite={handleDeclineInvite}
          />

          <div className="container-mobile">
            <HomeClubsSection 
              userClubs={userClubs}
              availableClubs={availableClubs}
              onSelectClub={handleSelectClub}
              onSelectUser={handleSelectUser}
              onCreateClub={() => setCreateClubDialogOpen(true)}
              onRequestJoin={handleRequestToJoin}
              onSearchClick={() => setSearchDialogOpen(true)}
            />
          </div>
          <ChatDrawerHandler 
            userClubs={userClubs}
            onSelectUser={handleSelectUser}
          />
          <SearchClubDialog
            open={searchDialogOpen}
            onOpenChange={setSearchDialogOpen}
            clubs={availableClubs}
            onRequestJoin={handleRequestToJoin}
          />
          <CreateClubDialog
            open={createClubDialogOpen}
            onOpenChange={setCreateClubDialogOpen}
          />
        </div>
      </ChatDrawerProvider>
    </UnreadMessagesProvider>
  );
};

export default HomeView;
