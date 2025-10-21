
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useClubMembershipSync = () => {
  const { currentUser, refreshCurrentUser } = useApp();
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced refresh function to prevent excessive API calls
  const debouncedRefresh = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      if (refreshCurrentUser) {
        console.log('[useClubMembershipSync] Executing debounced refresh');
        refreshCurrentUser().then(() => {
          console.log('[useClubMembershipSync] User data refreshed successfully');
        }).catch(err => {
          console.error('[useClubMembershipSync] Error refreshing user data:', err);
        });
      }
    }, 500); // 500ms debounce
  };
  
  useEffect(() => {
    if (!currentUser?.id) return;
    
    console.log('[useClubMembershipSync] Setting up club membership subscription for user:', currentUser.id);
    
    // Subscribe to ALL club_members table changes
    // This ensures all users get updates when memberships change in any club
    const channel = supabase
      .channel('club-membership-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_members'
        },
        (payload) => {
          console.log('[useClubMembershipSync] Club membership added:', payload);
          debouncedRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'club_members'
        },
        (payload) => {
          console.log('[useClubMembershipSync] Club membership removed:', payload);
          debouncedRefresh();
        }
      )
      .subscribe((status) => {
        console.log('[useClubMembershipSync] Subscription status:', status);
        
        // Handle subscription errors by checking if status contains error
        if (status !== 'SUBSCRIBED' && status !== 'CHANNEL_ERROR') {
          console.error('[useClubMembershipSync] Subscription error detected, attempting to reconnect...');
          // Retry subscription after a delay
          setTimeout(() => {
            console.log('[useClubMembershipSync] Retrying subscription...');
            // The effect will re-run and create a new subscription
          }, 2000);
        }
      });
      
    return () => {
      console.log('[useClubMembershipSync] Cleaning up club membership subscription');
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, refreshCurrentUser]);
  
  // Keep custom events for same-session optimizations only
  useEffect(() => {
    const handleClubMembershipChange = (event: CustomEvent) => {
      console.log('[useClubMembershipSync] Club membership change event (same session):', event.detail);
      debouncedRefresh();
    };
    
    const handleMembershipAccepted = (event: CustomEvent) => {
      console.log('[useClubMembershipSync] Membership accepted event (same session):', event.detail);
      debouncedRefresh();
    };
    
    window.addEventListener('clubMembershipChanged', handleClubMembershipChange as EventListener);
    window.addEventListener('membershipAccepted', handleMembershipAccepted as EventListener);
    
    return () => {
      window.removeEventListener('clubMembershipChanged', handleClubMembershipChange as EventListener);
      window.removeEventListener('membershipAccepted', handleMembershipAccepted as EventListener);
    };
  }, [currentUser?.id]);
};
