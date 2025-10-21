
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Accepts a join request by:
 * 1. Querying the club_requests table
 * 2. Adding the user to club_members
 * 3. Updating request status to accepted
 * 4. Deleting the notification
 */
export const acceptJoinRequestFromNotification = async (
  requesterId: string,
  clubId: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestActions] Processing accept request:', { requesterId, clubId });
    
    // First, verify the request exists and is pending
    const { data: requestData, error: requestError } = await supabase
      .from('club_requests')
      .select('id')
      .eq('user_id', requesterId)  // Using requesterId (the person who requested to join)
      .eq('club_id', clubId)
      .eq('status', 'PENDING')
      .single();
      
    if (requestError || !requestData) {
      console.error('[joinRequestActions] Error finding request:', requestError);
      toast.error("Join request not found or already processed");
      return false;
    }
    
    // Check if the club is full (max 5 members)
    const { data: clubData, error: clubError } = await supabase
      .from('clubs')
      .select('member_count')
      .eq('id', clubId)
      .single();
      
    if (clubError) {
      console.error('[joinRequestActions] Error checking club:', clubError);
      throw clubError;
    }
    
    if (clubData && clubData.member_count >= 5) {
      toast.error("Club is full (5/5 members). Cannot add more members.");
      return false;
    }
    
    // Add the user to club_members
    const { error: joinError } = await supabase
      .from('club_members')
      .insert({
        user_id: requesterId,
        club_id: clubId,
        is_admin: false
      });
      
    if (joinError) {
      console.error('[joinRequestActions] Error adding user to club:', joinError);
      throw joinError;
    }
    
    // Update request status to accepted
    const { error: updateError } = await supabase
      .from('club_requests')
      .update({ status: 'SUCCESS' })
      .eq('user_id', requesterId)
      .eq('club_id', clubId);
      
    if (updateError) {
      console.error('[joinRequestActions] Error updating request status:', updateError);
      throw updateError;
    }
    
    // Delete notifications related to this join request
    await deleteRelatedNotification(requesterId, clubId, 'join_request');
    
    // Show success toast
    toast.success("User has been added to the club");
    
    // Refresh UI state
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    return true;
  } catch (error) {
    console.error('[joinRequestActions] Error accepting request:', error);
    toast.error("Failed to accept join request");
    return false;
  }
};

/**
 * Denies a join request by:
 * 1. Querying the club_requests table
 * 2. Deleting the request
 * 3. Deleting the notification
 */
export const denyJoinRequestFromNotification = async (
  requesterId: string,
  clubId: string
): Promise<boolean> => {
  try {
    console.log('[joinRequestActions] Processing deny request:', { requesterId, clubId });
    
    // First, verify the request exists and is pending
    const { data: requestData, error: requestError } = await supabase
      .from('club_requests')
      .select('id')
      .eq('user_id', requesterId)  // Using requesterId (the person who requested to join)
      .eq('club_id', clubId)
      .eq('status', 'PENDING')
      .single();
      
    if (requestError || !requestData) {
      console.error('[joinRequestActions] Error finding request:', requestError);
      toast.error("Join request not found or already processed");
      return false;
    }
    
    // Delete the request
    const { error: deleteError } = await supabase
      .from('club_requests')
      .delete()
      .eq('user_id', requesterId)
      .eq('club_id', clubId);
      
    if (deleteError) {
      console.error('[joinRequestActions] Error deleting request:', deleteError);
      throw deleteError;
    }
    
    // Delete the notification
    await deleteRelatedNotification(requesterId, clubId, 'join_request');
    
    // Show success toast
    toast.success("Join request denied");
    
    // Refresh UI state
    window.dispatchEvent(new CustomEvent('userDataUpdated'));
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
    
    return true;
  } catch (error) {
    console.error('[joinRequestActions] Error denying request:', error);
    toast.error("Failed to deny join request");
    return false;
  }
};

/**
 * Helper function to delete notifications related to a join request
 * This works for both admin notifications and user notifications
 */
const deleteRelatedNotification = async (
  requesterId: string,
  clubId: string,
  type: 'join_request' | 'invite' | 'request_accepted'
): Promise<void> => {
  try {
    console.log('[joinRequestActions] Looking for notifications to delete:', { 
      requesterId, clubId, type 
    });
    
    // First, get notifications related to this request
    const { data: notifications, error: fetchError } = await supabase
      .from('notifications')
      .select('id, user_id, data')
      .eq('club_id', clubId)
      .eq('type', type);
    
    if (fetchError) {
      console.error('[joinRequestActions] Error fetching notifications:', fetchError);
      return;
    }
    
    if (!notifications || notifications.length === 0) {
      console.log('[joinRequestActions] No notifications found');
      return;
    }
    
    console.log('[joinRequestActions] Found notifications:', notifications);
    
    // Filter notifications that match our requester ID (either in the data field or by user_id)
    const matchingNotifications = notifications.filter(notification => {
      // For join requests sent to admins, the data contains the requester's ID
      if (notification.data && typeof notification.data === 'object') {
        const data = notification.data as Record<string, any>;
        if (
          (data.requesterId && data.requesterId === requesterId) || 
          (data.userId && data.userId === requesterId)
        ) {
          return true;
        }
      }
      
      // For other notification types where the requester is the notification recipient
      return notification.user_id === requesterId;
    });
    
    if (matchingNotifications.length === 0) {
      console.log('[joinRequestActions] No matching notifications found');
      return;
    }
    
    // Delete the matched notifications
    const notificationIds = matchingNotifications.map(n => n.id);
    console.log('[joinRequestActions] Deleting notifications with IDs:', notificationIds);
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds);
      
    if (error) {
      console.error('[joinRequestActions] Error deleting notifications:', error);
    } else {
      console.log('[joinRequestActions] Successfully deleted notifications');
    }
  } catch (error) {
    console.error('[joinRequestActions] Error in deleteRelatedNotification:', error);
  }
};
