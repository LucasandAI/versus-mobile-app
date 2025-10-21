
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";
import { createNotification } from '@/utils/notifications/notificationManagement';
import { sendClubInvite } from '@/utils/clubInviteActions';
import { Club } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';
import { supabase } from '@/integrations/supabase/client';
import { hasPendingInvite } from '@/lib/notificationUtils';

export const useClubNavigation = () => {
  const { currentUser, setCurrentView, setSelectedClub } = useApp();

  const navigateToClub = (club: Partial<Club>) => {
    if (!club || !club.id) {
      console.error('[useClubNavigation] Cannot navigate to club, missing club ID');
      return;
    }

    console.log('[useClubNavigation] Navigating to club:', club.id);
    
    // Check if this is one of the user's clubs first (full data already available)
    const userClub = currentUser?.clubs?.find(c => c.id === club.id);
    
    if (userClub) {
      // Use the full club data from the current user's clubs
      setSelectedClub(userClub);
      setCurrentView('clubDetail');
    } else {
      // For non-member clubs, use the standard navigation which will fetch full data
      const { navigateToClubDetail } = useNavigation();
      navigateToClubDetail(club.id, club);
    }
  };

  const handleLeaderboardClick = () => {
    setCurrentView('leaderboard');
  };

  const handleProfileClick = () => {
    setCurrentView('profile');
  };

  const handleJoinRequest = async (clubId: string, clubName: string) => {
    try {
      // Check if user is already a member of this club
      const isAlreadyMember = currentUser?.clubs?.some(club => club.id === clubId);
      
      if (isAlreadyMember) {
        toast({
          title: "Already a member",
          description: `You're already a member of ${clubName}.`
        });
        return false;
      }
      
      // Check if there's already a pending request
      const hasPending = await hasPendingInvite(clubId);
      if (hasPending) {
        toast({
          title: "Request pending",
          description: `You already have a pending request for ${clubName}.`
        });
        return false;
      }

      const success = await createNotification({
        type: 'join_request',
        club_id: clubId,
        user_id: currentUser!.id,
        message: `wants to join ${clubName}`
      });

      if (success) {
        toast({
          title: "Join request sent",
          description: `Your request to join ${clubName} has been sent!`
        });
        return true;
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Failed to send join request. Please try again.",
        variant: "destructive"
      });
    }
    
    return false;
  };

  const handleSendInvite = async (userId: string, userName: string, clubId: string, clubName: string) => {
    try {
      // Use our updated sendClubInvite function to send the invite and create notification
      const success = await sendClubInvite(clubId, clubName, userId, userName);
      
      return success;
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive"
      });
    }
    
    return false;
  };

  return {
    navigateToClub,
    handleLeaderboardClick,
    handleProfileClick,
    handleJoinRequest,
    handleSendInvite
  };
};
