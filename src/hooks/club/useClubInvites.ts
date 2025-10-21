
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { sendClubInvite } from '@/utils/clubInviteActions';

type UserResult = {
  id: string;
  name: string;
  avatar: string | null;
  alreadyInvited: boolean;
  alreadyMember: boolean;
};

export const useClubInvites = (clubId: string, clubName?: string) => {
  const [users, setUsers] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

  // Fetch users not in the club (for invites)
  const fetchAvailableUsers = useCallback(async () => {
    if (!clubId) return;
    
    setLoading(true);
    setError(null);

    try {
      console.log('[useClubInvites] Fetching users for club:', clubId);
      
      // Get existing club members
      const { data: members, error: membersError } = await supabase
        .from('club_members')
        .select('user_id')
        .eq('club_id', clubId);
        
      if (membersError) {
        throw new Error(`Error fetching club members: ${membersError.message}`);
      }
      
      // Get only current pending invites - we want to allow re-inviting users who previously declined
      const { data: invites, error: invitesError } = await supabase
        .from('club_invites')
        .select('user_id, status')
        .eq('club_id', clubId)
        .eq('status', 'pending');
        
      if (invitesError) {
        throw new Error(`Error fetching club invites: ${invitesError.message}`);
      }
      
      // Create exclusion sets for efficient lookups
      const memberIds = new Set(members?.map(m => m.user_id) || []);
      const invitedUserIds = new Set(invites?.map(invite => invite.user_id) || []);
      
      // Fetch all users except the current user
      const { data: allUsers, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar');
        
      if (usersError) {
        throw new Error(`Error fetching users: ${usersError.message}`);
      }
      
      // Filter and format users - include all users except those who are currently members
      // or have a pending invite. Allow users who previously left or declined invites.
      const formattedUsers = allUsers
        ?.filter(user => {
          return !memberIds.has(user.id); // Only exclude current members
        })
        .map(user => ({
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          alreadyInvited: invitedUserIds.has(user.id), // Only shows current pending invites
          alreadyMember: memberIds.has(user.id)
        })) || [];
      
      setUsers(formattedUsers);
    } catch (error) {
      console.error('[useClubInvites] Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  // Listen for changes to invites and members
  useEffect(() => {
    fetchAvailableUsers();
    
    // Set up realtime listeners
    const membersChannel = supabase
      .channel('club-invites-members-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `club_id=eq.${clubId}`
        },
        () => {
          console.log('[useClubInvites] Club members changed, refreshing data');
          fetchAvailableUsers();
        }
      )
      .subscribe();
      
    const invitesChannel = supabase
      .channel('club-invites-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_invites',
          filter: `club_id=eq.${clubId}`
        },
        () => {
          console.log('[useClubInvites] Club invites changed, refreshing data');
          fetchAvailableUsers();
        }
      )
      .subscribe();
      
    // Clean up channels on unmount
    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(invitesChannel);
    };
  }, [clubId, fetchAvailableUsers]);

  // Function to send an invite
  const sendInvite = async (userId: string, userName: string): Promise<boolean> => {
    if (!clubId || !clubName) {
      toast.error('Club information missing');
      return false;
    }
    
    // Mark this user as processing
    setProcessingUsers(prev => new Set(prev).add(userId));
    
    try {
      // Use the improved sendClubInvite function that creates notifications
      const success = await sendClubInvite(clubId, clubName, userId, userName);
      
      if (success) {
        // Update the local state optimistically
        setUsers(prev => 
          prev.map(user => 
            user.id === userId 
              ? { ...user, alreadyInvited: true } 
              : user
          )
        );
      }
      
      return success;
    } catch (error) {
      console.error('[useClubInvites] Error sending invite:', error);
      toast.error('Failed to send invitation');
      return false;
    } finally {
      // Remove this user from processing state
      setProcessingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    }
  };

  // Check if a user is currently being processed
  const isProcessing = useCallback((userId: string): boolean => {
    return processingUsers.has(userId);
  }, [processingUsers]);

  return { 
    users, 
    loading, 
    error, 
    sendInvite, 
    isProcessing,
    refreshUsers: fetchAvailableUsers
  };
};
