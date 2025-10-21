
import { useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

export const useNotificationListener = () => {
  const { currentUser, refreshCurrentUser } = useApp();
  
  useEffect(() => {
    if (!currentUser?.id || !refreshCurrentUser) return;
    
    console.log('[useNotificationListener] Setting up notification subscription for user:', currentUser.id);
    
    // Subscribe to notifications for the current user
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`
        },
        (payload) => {
          console.log('[useNotificationListener] New notification received:', payload);
          
          const notification = payload.new;
          
          // If this is a request_accepted notification, immediately refresh user data
          if (notification.type === 'request_accepted') {
            console.log('[useNotificationListener] Request accepted notification - refreshing user data immediately');
            refreshCurrentUser().then(() => {
              console.log('[useNotificationListener] User data refreshed after request acceptance');
            }).catch(err => {
              console.error('[useNotificationListener] Error refreshing user data:', err);
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('[useNotificationListener] Notification subscription status:', status);
      });
      
    return () => {
      console.log('[useNotificationListener] Cleaning up notification subscription');
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, refreshCurrentUser]);
};
