
import React, { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useProfileState } from './profile/hooks/useProfileState';
import UserProfileMainContent from './profile/UserProfileMainContent';
import UserProfileDialogs from './profile/UserProfileDialogs';
import { useUserProfileStateLogic } from './profile/hooks/useUserProfileStateLogic';
import { clearAllAuthData } from '@/integrations/supabase/safeClient';
import { toast } from '@/hooks/use-toast';

const UserProfile: React.FC = () => {
  const { 
    currentUser, 
    selectedUser, 
    setCurrentUser, 
    setCurrentView, 
    setSelectedClub,
    setSelectedUser
  } = useApp();
  const isMobile = useIsMobile();

  const {
    loading: profileStateLoading,
    inviteDialogOpen,
    setInviteDialogOpen,
    showMoreAchievements,
    setShowMoreAchievements,
    editProfileOpen,
    setEditProfileOpen,
    logoutDialogOpen,
    setLogoutDialogOpen
  } = useProfileState();

  const { loading: profileDataLoading, weeklyDistance } = useUserProfileStateLogic();
  const loading = profileStateLoading || profileDataLoading;

  useEffect(() => {
    if (!selectedUser && currentUser) {
      console.log('No selected user, setting to current user');
      setSelectedUser(currentUser);
    }
  }, [selectedUser, currentUser, setSelectedUser]);

  // Clubs where currentUser is admin (for "Invite to Club" button)
  const adminClubs = currentUser?.clubs?.filter(club =>
    club.members.some(member => member.id === currentUser.id && member.isAdmin)
  ) || [];

  const isCurrentUserProfile = currentUser?.id === selectedUser?.id;
  const showInviteButton = !isCurrentUserProfile && adminClubs.length > 0;

  const handleLogout = async () => {
    try {
      // Use clearAllAuthData to fully clear the session
      await clearAllAuthData();
      
      // Reset application state
      setCurrentUser(null);
      setCurrentView('connect');
      setSelectedClub(null);
      setLogoutDialogOpen(false);
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account"
      });
    } catch (error) {
      console.error('Error during logout:', error);
      toast({
        title: "Logout failed",
        description: "There was a problem logging out",
        variant: "destructive"
      });
    }
  };

  if (!selectedUser) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading Profile...</h1>
          <p className="text-gray-500">Please wait while we load your profile information</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <UserProfileMainContent
        currentUser={currentUser}
        selectedUser={selectedUser}
        setCurrentView={setCurrentView}
        setEditProfileOpen={setEditProfileOpen}
        setLogoutDialogOpen={setLogoutDialogOpen}
        loading={loading}
        weeklyDistance={weeklyDistance}
        showInviteButton={showInviteButton}
        inviteDialogOpen={inviteDialogOpen}
        setInviteDialogOpen={setInviteDialogOpen}
        showMoreAchievements={showMoreAchievements}
        setShowMoreAchievements={setShowMoreAchievements}
        editProfileOpen={editProfileOpen}
        logoutDialogOpen={logoutDialogOpen}
        adminClubs={adminClubs}
      />
      <UserProfileDialogs
        editProfileOpen={editProfileOpen}
        setEditProfileOpen={setEditProfileOpen}
        currentUser={currentUser}
        logoutDialogOpen={logoutDialogOpen}
        setLogoutDialogOpen={setLogoutDialogOpen}
        handleLogout={handleLogout}
      />
    </>
  );
};

export default UserProfile;
