
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Accept a join request and handle all related updates
export const acceptJoinRequest = async (
  userId: string, 
  clubId: string, 
  userName: string
): Promise<boolean> => {
  try {
    console.log('[acceptJoinRequest] Processing acceptance for user:', userId, 'to club:', clubId);
    
    // Step 1: Add user to club members
    const { error: memberError } = await supabase
      .from('club_members')
      .insert({
        user_id: userId,
        club_id: clubId,
        is_admin: false
      });
      
    if (memberError) {
      console.error('[acceptJoinRequest] Error adding member:', memberError);
      toast.error('Failed to add member to club');
      return false;
    }
    
    // Step 2: Update the join request status to SUCCESS (this will trigger the notification)
    const { error: statusError } = await supabase
      .from('club_requests')
      .update({ status: 'SUCCESS' })
      .eq('user_id', userId)
      .eq('club_id', clubId);
      
    if (statusError) {
      console.error('[acceptJoinRequest] Error updating request status:', statusError);
      // Don't return false here as the member was already added
    }
    
    // Step 3: Delete the join request after successful processing
    const { error: deleteError } = await supabase
      .from('club_requests')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId);
      
    if (deleteError) {
      console.error('[acceptJoinRequest] Error deleting request:', deleteError);
    }
    
    // Step 4: Delete admin notifications about this join request
    await deleteJoinRequestNotifications(userId, clubId);
    
    // Step 5: Trigger comprehensive real-time updates for ALL users
    // These events will be picked up by ALL active sessions
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    // Broadcast club membership change for all users
    window.dispatchEvent(new CustomEvent('clubMembershipChanged', { 
      detail: { clubId, userId, action: 'added' } 
    }));
    
    // Global membership acceptance event - triggers refresh for ALL active sessions
    // This ensures User B gets the update immediately
    window.dispatchEvent(new CustomEvent('membershipAccepted', {
      detail: { userId, clubId, userName }
    }));
    
    // Additional broadcast for global state sync
    setTimeout(() => {
      console.log('[acceptJoinRequest] Broadcasting delayed global refresh');
      window.dispatchEvent(new CustomEvent('globalUserRefresh'));
    }, 100);
    
    toast.success(`${userName} has been added to the club`);
    return true;
    
  } catch (error) {
    console.error('[acceptJoinRequest] Unexpected error:', error);
    toast.error('Failed to accept join request');
    return false;
  }
};

// Deny a join request and clean up notifications
export const denyJoinRequest = async (
  userId: string, 
  clubId: string
): Promise<boolean> => {
  try {
    console.log('[denyJoinRequest] Processing denial for user:', userId, 'from club:', clubId);
    
    // Step 1: Delete the join request
    const { error: deleteError } = await supabase
      .from('club_requests')
      .delete()
      .eq('user_id', userId)
      .eq('club_id', clubId);
      
    if (deleteError) {
      console.error('[denyJoinRequest] Error deleting request:', deleteError);
      toast.error('Failed to deny join request');
      return false;
    }
    
    // Step 2: Delete admin notifications about this join request
    await deleteJoinRequestNotifications(userId, clubId);
    
    // Step 3: Trigger real-time updates
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    toast.success('Join request denied');
    return true;
    
  } catch (error) {
    console.error('[denyJoinRequest] Unexpected error:', error);
    toast.error('Failed to deny join request');
    return false;
  }
};

// Helper function to delete join request notifications
const deleteJoinRequestNotifications = async (userId: string, clubId: string) => {
  try {
    // Delete all join_request notifications for this user/club combination
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('type', 'join_request')
      .eq('club_id', clubId)
      .or(`data->>userId.eq.${userId},data->>requesterId.eq.${userId}`);
      
    if (error) {
      console.error('[deleteJoinRequestNotifications] Error deleting notifications:', error);
    } else {
      console.log('[deleteJoinRequestNotifications] Successfully deleted join request notifications');
    }
  } catch (error) {
    console.error('[deleteJoinRequestNotifications] Unexpected error:', error);
  }
};
