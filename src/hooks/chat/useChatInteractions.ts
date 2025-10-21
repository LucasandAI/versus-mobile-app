
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';
import { sendClubInvite } from '@/utils/clubInviteActions';

export const useChatInteractions = () => {
  const { setCurrentView, setSelectedClub } = useApp();
  const { navigateToUserProfile, navigateToClub } = useNavigation();

  const handleMatchClick = (selectedClub: Club | null) => {
    if (!selectedClub || !selectedClub.currentMatch) return;
    setSelectedClub(selectedClub);
    setCurrentView('clubDetail');
  };

  const handleSelectUser = (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    navigateToUserProfile(userId, userName, userAvatar);
  };
  
  const handleClubClick = (club: Club) => {
    navigateToClub(club);
  };

  // Added a handler specifically for club invites from chat
  const handleClubInvite = async (userId: string, userName: string, clubId: string, clubName: string): Promise<boolean> => {
    return await sendClubInvite(clubId, clubName, userId, userName);
  };

  return {
    handleMatchClick,
    handleSelectUser,
    handleClubClick,
    handleClubInvite
  };
};
