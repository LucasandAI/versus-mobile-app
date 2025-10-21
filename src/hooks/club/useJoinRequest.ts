
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';

export const useJoinRequest = (clubId: string) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const { currentUser } = useApp();

  // Use useCallback to memoize the function and prevent recreation on every render
  const checkPendingRequest = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('club_requests')
        .select('*')
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .eq('status', 'PENDING')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking pending request:', error);
      }

      setHasPendingRequest(!!data);
      return !!data;
    } catch (error) {
      console.error('Error checking pending request:', error);
      return false;
    }
  }, [clubId]);

  // Only check pending requests once when component mounts or when user/clubId changes
  useEffect(() => {
    if (currentUser) {
      checkPendingRequest(currentUser.id);
    }
  }, [currentUser, clubId, checkPendingRequest]);

  const sendJoinRequest = async (userId: string) => {
    // Prevent multiple rapid clicks
    if (isRequesting) return false;
    
    setIsRequesting(true);
    // Optimistically update UI immediately
    setHasPendingRequest(true);
    
    try {
      console.log(`[sendJoinRequest] Sending request for user ${userId} to join club ${clubId}`);
      
      const { error } = await supabase
        .from('club_requests')
        .insert({
          user_id: userId,
          club_id: clubId,
          status: 'PENDING'
        });

      if (error) {
        console.error('Error sending join request:', error);
        // Revert optimistic update on error
        setHasPendingRequest(false);
        throw error;
      }

      console.log('[sendJoinRequest] Request sent successfully');
      
      toast({
        title: "Request Sent",
        description: "Your request to join has been sent to the club admins"
      });
      
      return true;
    } catch (error) {
      console.error('Error sending join request:', error);
      toast({
        title: "Error",
        description: "Could not send join request",
        variant: "destructive"
      });
      return false;
    } finally {
      // Small delay before allowing new requests to prevent button flickering
      setTimeout(() => {
        setIsRequesting(false);
      }, 500);
    }
  };

  const cancelJoinRequest = async (userId: string) => {
    // Prevent multiple rapid clicks
    if (isRequesting) return false;
    
    setIsRequesting(true);
    // Optimistically update UI immediately
    setHasPendingRequest(false);
    
    try {
      // Delete the request directly instead of updating status
      const { error } = await supabase
        .from('club_requests')
        .delete()
        .eq('club_id', clubId)
        .eq('user_id', userId)
        .eq('status', 'PENDING');

      if (error) {
        // Revert optimistic update on error
        setHasPendingRequest(true);
        throw error;
      }

      // Delete any admin notifications related to this join request
      try {
        // Find notifications with type 'join_request' for this club where the data contains this user's ID
        const { data: notifications, error: notificationError } = await supabase
          .from('notifications')
          .select('id, data')
          .eq('club_id', clubId)
          .eq('type', 'join_request');
          
        if (notificationError) {
          console.error('Error finding join request notifications:', notificationError);
        } else if (notifications && notifications.length > 0) {
          // Filter to only get notifications related to this user
          const notificationsToDelete = notifications.filter(notification => {
            // Safely check if data exists and contains requesterId or userId matching this user
            if (!notification.data) return false;
            
            const data = notification.data as Record<string, any>;
            return (
              (data.requesterId && data.requesterId === userId) || 
              (data.userId && data.userId === userId)
            );
          });
          
          if (notificationsToDelete.length > 0) {
            const notificationIds = notificationsToDelete.map(n => n.id);
            
            console.log(`[cancelJoinRequest] Deleting ${notificationIds.length} notifications:`, notificationIds);
            
            // Delete the notifications
            const { error: deleteError } = await supabase
              .from('notifications')
              .delete()
              .in('id', notificationIds);
              
            if (deleteError) {
              console.error('Error deleting notifications:', deleteError);
            } else {
              console.log('Successfully deleted admin notifications for join request');
            }
          } else {
            console.log('No matching notifications found to delete');
          }
        }
      } catch (error) {
        console.error('Error handling notification deletion:', error);
      }

      toast({
        title: "Request Canceled",
        description: "Your join request has been canceled"
      });
      
      // Dispatch event to update notifications in the UI
      window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error canceling join request:', error);
      toast({
        title: "Error",
        description: "Could not cancel join request",
        variant: "destructive"
      });
      return false;
    } finally {
      // Small delay before allowing new requests to prevent button flickering
      setTimeout(() => {
        setIsRequesting(false);
      }, 500);
    }
  };

  return {
    isRequesting,
    hasPendingRequest,
    sendJoinRequest,
    cancelJoinRequest,
    checkPendingRequest
  };
};
