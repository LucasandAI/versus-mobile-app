
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { toast } from "@/hooks/use-toast";
import { handleNotification } from '@/utils/notificationUtils';
import { supabase } from '@/integrations/supabase/client';

export const useClubActions = (club: Club) => {
  const { currentUser, setCurrentView, setCurrentUser, setSelectedClub } = useApp();

  const handleLeaveClub = async (newAdminId?: string) => {
    if (!currentUser || !currentUser.clubs.some(c => c.id === club.id)) return;
    
    try {
      // If a new admin is specified, transfer admin rights BEFORE removing the current user
      if (newAdminId && currentUser.id !== newAdminId) {
        // Validate that the new admin is actually a member of the club
        const isValidMember = club.members.some(member => member.id === newAdminId);
        if (!isValidMember) {
          throw new Error('Selected user is not a member of this club');
        }

        console.log(`Transferring admin rights to user ${newAdminId} before leaving club`);
        const { error: adminError } = await supabase
          .from('club_members')
          .update({ is_admin: true })
          .eq('club_id', club.id)
          .eq('user_id', newAdminId);
        
        if (adminError) {
          throw new Error(`Failed to transfer admin rights: ${adminError.message}`);
        }
        
        console.log('Admin rights transferred successfully');
      }

      // Now remove the current user from the club
      console.log(`Removing current user ${currentUser.id} from club ${club.id}`);
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', club.id)
        .eq('user_id', currentUser.id);
      
      if (error) {
        throw new Error(`Failed to leave club: ${error.message}`);
      }
      
      console.log('Successfully removed user from club');

      // Update local state after successful database updates
      const updatedClub = { ...club };
      
      // Update admin status if a new admin was assigned
      if (newAdminId) {
        updatedClub.members = club.members.map(member => ({
          ...member,
          isAdmin: member.id === newAdminId ? true : member.isAdmin
        }));
      }
      
      // Remove the current user from the members list
      updatedClub.members = updatedClub.members.filter(member => member.id !== currentUser.id);
      
      const updatedClubs = currentUser.clubs.filter(c => c.id !== club.id);
      const updatedUser = {
        ...currentUser,
        clubs: updatedClubs
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setSelectedClub(null);
      
      toast({
        title: "Left Club",
        description: `You have successfully left ${club.name}.${newAdminId ? ' Admin rights have been transferred.' : ''}`
      });
      
      setCurrentView('home');
      
      // Dispatch events to update UI components
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
      
      // Small delay to ensure database updates are processed
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('clubMembershipChanged', { 
          detail: { clubId: club.id } 
        }));
      }, 300);
      
    } catch (error) {
      console.error('Error leaving club:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to leave club",
        variant: "destructive"
      });
    }
  };

  const handleMakeMemberAdmin = async (memberId: string, memberName: string) => {
    if (!club || !club.id) return false;
    
    try {
      // Update member to be admin in Supabase
      const { error } = await supabase
        .from('club_members')
        .update({ is_admin: true })
        .eq('club_id', club.id)
        .eq('user_id', memberId);

      if (error) {
        throw new Error(`Failed to make member an admin: ${error.message}`);
      }

      toast({
        title: "Admin Rights Granted",
        description: `${memberName} is now an admin of the club.`
      });
      
      // Trigger refresh to update UI
      window.dispatchEvent(new CustomEvent('userDataUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error making member admin:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update admin status",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleJoinFromInvite = async () => {
    if (!club || !currentUser) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === club.id
    );
    
    if (invitation) {
      try {
        // Add the member to the club in Supabase
        const { error } = await supabase
          .from('club_members')
          .insert({
            club_id: club.id,
            user_id: currentUser.id,
            is_admin: false
          });
        
        if (error) {
          throw new Error(`Failed to join club: ${error.message}`);
        }
        
        // Update the invitation status to 'accepted'
        if (invitation.id) {
          await supabase
            .from('club_invites')
            .update({ status: 'accepted' })
            .eq('id', invitation.id);
        }
        
        handleNotification(invitation.id, 'delete');
        
        // Update local state
        window.dispatchEvent(new CustomEvent('userDataUpdated'));
        
      } catch (error) {
        console.error('Error joining club:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to join club",
          variant: "destructive"
        });
      }
    }
  };

  const handleDeclineInvite = async () => {
    if (!club) return;
    
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const invitation = notifications.find(
      (n: any) => n.type === 'invitation' && n.clubId === club.id
    );
    
    if (invitation) {
      try {
        // Update the invitation status to 'rejected'
        if (invitation.id) {
          await supabase
            .from('club_invites')
            .update({ status: 'rejected' })
            .eq('id', invitation.id);
        }
        
        handleNotification(invitation.id, 'delete');
        
        toast({
          title: "Invite Declined",
          description: `You have declined the invitation to join ${club.name}.`
        });
      } catch (error) {
        console.error('Error declining invitation:', error);
      }
    }
  };

  return {
    handleLeaveClub,
    handleJoinFromInvite,
    handleDeclineInvite,
    handleMakeMemberAdmin
  };
};
