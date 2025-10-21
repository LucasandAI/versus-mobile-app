import React from "react";
import { Card } from '../ui/card';
import ProfileHeader from './ProfileHeader';
import UserHeader from './UserHeader';
import UserStats from './UserStats';
import UserInviteSection from './UserInviteSection';
import UserClubs from './UserClubs';
// import UserAchievements from './UserAchievements';
import NoUserState from './states/NoUserState';
import { getBestLeague } from './helpers/LeagueHelper';
import { useWeeklyDistance } from '@/components/profile/hooks/userProfile/useWeeklyDistance';
// import { 
//   completedAchievements, 
//   inProgressAchievements, 
//   moreInProgressAchievements 
// } from './data/achievements';
import { User, Club } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';
import { useApp } from '@/context/AppContext';

interface UserProfileMainContentProps {
  currentUser: User | null;
  selectedUser: User | null;
  setCurrentView: (view: string) => void;
  setEditProfileOpen: (x: boolean) => void;
  setLogoutDialogOpen: (x: boolean) => void;
  loading: boolean;
  weeklyDistance: number;
  showInviteButton: boolean;
  inviteDialogOpen: boolean;
  setInviteDialogOpen: (v: boolean) => void;
  showMoreAchievements: boolean;
  setShowMoreAchievements: (show: boolean) => void;
  editProfileOpen: boolean;
  logoutDialogOpen: boolean;
  adminClubs: Club[];
}

const UserProfileMainContent: React.FC<UserProfileMainContentProps> = ({
  currentUser,
  selectedUser,
  setCurrentView,
  setEditProfileOpen,
  setLogoutDialogOpen,
  loading,
  weeklyDistance: weeklyDistanceProp,
  showInviteButton,
  inviteDialogOpen,
  setInviteDialogOpen,
  showMoreAchievements,
  setShowMoreAchievements,
  editProfileOpen,
  logoutDialogOpen,
  adminClubs
}) => {
  const { setSelectedClub } = useApp();
  const { navigateToClub } = useNavigation();
  
  if (!selectedUser) {
    return <NoUserState onBackHome={() => setCurrentView('home')} />;
  }

  const isMobile = false; // You may want to inject this as a prop for actual useMobile
  const isCurrentUserProfile = currentUser?.id === selectedUser?.id;
  const bestLeague = getBestLeague(selectedUser.clubs);

  // Weekly contribution from DB (user_activities)
  const { weeklyDistance: weeklyMeters, isLoading: weeklyLoading } = useWeeklyDistance(selectedUser?.id);
  const weeklyKm = Number(((weeklyMeters || 0) / 1000).toFixed(2));

  const handleClubClick = (club: Club) => {
    // Set the selected club in global state 
    setSelectedClub(club);
    // Change view to club detail
    setCurrentView('clubDetail');
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-gray-50 pb-20">
      <div className="w-full">
        <ProfileHeader
          currentUser={currentUser}
          selectedUser={selectedUser}
          onBackClick={() => setCurrentView('home')}
        />
      </div>
      <div className="px-4 w-full max-w-screen-lg mx-auto">
        <Card className={`w-full ${isMobile ? '' : 'max-w-md mx-auto'} mt-4 p-6 rounded-lg`}>
          <UserHeader
            user={selectedUser}
            loading={loading}
            isCurrentUserProfile={isCurrentUserProfile}
            onEditProfile={() => setEditProfileOpen(true)}
            onLogoutClick={() => setLogoutDialogOpen(true)}
          />

          <UserStats
            loading={loading || weeklyLoading}
            weeklyDistance={weeklyKm}
            bestLeague={bestLeague.league}
            bestLeagueTier={bestLeague.tier}
          />

          <UserInviteSection 
            showInviteButton={showInviteButton}
            inviteDialogOpen={inviteDialogOpen}
            setInviteDialogOpen={setInviteDialogOpen}
            selectedUser={selectedUser}
            adminClubs={adminClubs}
            isCurrentUserProfile={isCurrentUserProfile}
          />
        </Card>
        <UserClubs
          user={selectedUser}
          loading={loading}
          onClubClick={handleClubClick}
        />
        {/* <UserAchievements
          loading={loading}
          isCurrentUserProfile={isCurrentUserProfile}
          completedAchievements={completedAchievements}
          inProgressAchievements={inProgressAchievements}
          moreInProgressAchievements={moreInProgressAchievements}
          showMoreAchievements={showMoreAchievements}
          onToggleMoreAchievements={() => setShowMoreAchievements(!showMoreAchievements)}
        /> */}
      </div>
    </div>
  );
};

export default UserProfileMainContent;
