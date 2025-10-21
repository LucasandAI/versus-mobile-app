
import { useApp } from '@/context/AppContext';
import { getClubToJoin } from '@/utils/club';
import { useClubValidation } from './useClubValidation';
import { toast } from "@/hooks/use-toast";
import { handleNotification } from '@/utils/notificationUtils';
import { supabase } from '@/integrations/supabase/client';

export const useClubJoin = () => {
  const { currentUser, setCurrentUser } = useApp();
  const { validateClubJoin, validateClubRequest } = useClubValidation();

  const handleRequestToJoin = async (clubId: string, clubName: string) => {
    if (!currentUser) {
      toast({
        title: "Login Required",
        description: "You need to be logged in to request joining a club",
        variant: "destructive"
      });
      return;
    }
    
    if (validateClubJoin(currentUser, clubName)) {
      try {
        // Check if user already has a pending request for this club
        const { data: existingRequest } = await supabase
          .from('club_requests')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('club_id', clubId)
          .eq('status', 'PENDING')
          .maybeSingle();
          
        if (existingRequest) {
          // Delete the request instead of updating to 'cancelled'
          const { error } = await supabase
            .from('club_requests')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('club_id', clubId)
            .eq('status', 'PENDING');
            
          if (error) {
            console.error('Error canceling join request:', error);
            throw error;
          }
          
          toast({
            title: "Request Canceled",
            description: `Your request to join ${clubName} has been canceled`
          });
          return;
        }
        
        // If no existing request, create a new one
        const { error } = await supabase
          .from('club_requests')
          .insert({
            user_id: currentUser.id,
            club_id: clubId,
            status: 'PENDING'
          });
          
        if (error) {
          console.error('Error sending join request:', error);
          throw error;
        }
        
        toast({
          title: "Request Sent",
          description: `Your request to join ${clubName} has been sent`
        });
        
        validateClubRequest(clubName);
      } catch (error) {
        console.error('Error in handleRequestToJoin:', error);
        toast({
          title: "Error",
          description: "Could not process your request. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleJoinClub = (clubId: string, clubName: string) => {
    if (!currentUser || !validateClubJoin(currentUser, clubName)) return;
    
    // Debug logging
    console.log('Joining club:', clubId, clubName);
    console.log('Current user clubs:', currentUser.clubs);
    
    // Check if user is already a member of this club by ID
    const isAlreadyMember = currentUser.clubs.some(club => club.id === clubId);
    console.log('Is already member:', isAlreadyMember);
    
    if (isAlreadyMember) {
      toast({
        title: "Already a Member",
        description: `You are already a member of ${clubName}.`,
        variant: "destructive"
      });
      return;
    }
    
    // Get clubs from localStorage or initialize empty array
    let allClubs = [];
    try {
      const storedClubs = localStorage.getItem('clubs');
      allClubs = storedClubs ? JSON.parse(storedClubs) : [];
    } catch (error) {
      console.error('Error parsing clubs from localStorage:', error);
      allClubs = [];
    }

    const clubToJoin = getClubToJoin(clubId, clubName, allClubs);
    
    if (!clubToJoin.members) {
      clubToJoin.members = [];
    }
    
    // Remove any existing instances of the user in the club members list to prevent duplicates
    clubToJoin.members = clubToJoin.members.filter(member => member.id !== currentUser.id);
    
    // Add user to club members with distanceContribution
    clubToJoin.members.push({
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar || '/placeholder.svg',
      isAdmin: false,
      distanceContribution: 0
    });
    
    // Update localStorage
    if (!allClubs.find((club: any) => club.id === clubId)) {
      allClubs.push(clubToJoin);
    } else {
      // Update existing club in the array
      const index = allClubs.findIndex((club: any) => club.id === clubId);
      if (index !== -1) {
        allClubs[index] = clubToJoin;
      }
    }
    localStorage.setItem('clubs', JSON.stringify(allClubs));
    
    const updatedUser = {
      ...currentUser,
      clubs: [...currentUser.clubs.filter(club => club.id !== clubId), clubToJoin]
    };
    
    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    toast({
      title: "Club Joined",
      description: `You have successfully joined ${clubToJoin.name}!`
    });
    
    // Find and remove all invitations to this club
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitationsToThisClub = notifications.filter(
      (n: any) => n.type === 'invitation' && n.clubId === clubId
    );
    
    // Process each invitation to the club
    invitationsToThisClub.forEach((invitation: any) => {
      handleNotification(invitation.id, 'delete');
    });
    
    // Dispatch events to update UI
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
  };

  return {
    handleRequestToJoin,
    handleJoinClub
  };
};
