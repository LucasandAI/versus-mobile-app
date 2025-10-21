
import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { handleNewMessagePayload, handleMessageDeletion } from './utils/subscriptionHandlers';
import { useApp } from '@/context/AppContext';
import { isConversationActive } from '@/utils/chat/activeConversationTracker';

export const useClubMessageSubscriptions = (
  userClubs: Club[],
  isOpen: boolean,
  activeSubscriptionsRef: React.MutableRefObject<Record<string, boolean>>,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const { currentUser } = useApp();
  const selectedClubRef = useRef<string | null>(null);
  const clubsRef = useRef<Club[]>(userClubs);
  
  // Keep clubs reference updated
  useEffect(() => {
    clubsRef.current = userClubs;
  }, [userClubs]);
  
  // Handle selected club changes from events
  useEffect(() => {
    const handleClubSelect = (event: CustomEvent) => {
      if (event.detail && event.detail.clubId) {
        selectedClubRef.current = event.detail.clubId;
        console.log(`[useClubMessageSubscriptions] Club selected from event: ${event.detail.clubId}`);
        
        // Explicitly mark as active to ensure real-time updates work
        if (event.detail.clubId) {
          console.log(`[useClubMessageSubscriptions] Marking club conversation active: ${event.detail.clubId}`);
          window.dispatchEvent(new CustomEvent('club-conversation-active', {
            detail: { clubId: event.detail.clubId }
          }));
        }
      }
    };
    
    window.addEventListener('clubSelected', handleClubSelect as EventListener);
    
    // Also listen for active conversation changes
    const handleConversationChange = (event: CustomEvent) => {
      if (event.detail && event.detail.type === 'club') {
        selectedClubRef.current = event.detail.id;
        console.log(`[useClubMessageSubscriptions] Active club conversation updated: ${event.detail.id}`);
      } else if (!event.detail) {
        selectedClubRef.current = null;
      }
    };
    
    window.addEventListener('conversation-active-change', handleConversationChange as EventListener);
    
    return () => {
      window.removeEventListener('clubSelected', handleClubSelect as EventListener);
      window.removeEventListener('conversation-active-change', handleConversationChange as EventListener);
    };
  }, []);
  
  // Set up real-time subscription for all clubs
  useEffect(() => {
    // Don't subscribe if not open or no clubs
    if (!isOpen || userClubs.length === 0 || !currentUser?.id) return;
    
    console.log('[useClubMessageSubscriptions] Setting up subscription for clubs:', userClubs.length);
    
    // Create channel IDs for each club to ensure proper tracking
    const clubChannels: Record<string, any> = {};
    
    // Set up individual channels for each club for better isolation
    userClubs.forEach(club => {
      const channelId = `club-messages-${club.id}`;
      
      const channel = supabase
        .channel(channelId)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'club_chat_messages',
            filter: `club_id=eq.${club.id}`
          }, 
          (payload) => {
            console.log('[useClubMessageSubscriptions] New message detected for club:', {
              id: payload.new.id,
              club_id: payload.new.club_id,
              is_current_user: payload.new.sender_id === currentUser.id,
              is_active: isConversationActive('club', payload.new.club_id)
            });
            
            // Always process messages for real-time display
            handleNewMessagePayload(
              payload, 
              clubsRef.current, 
              setClubMessages, 
              currentUser, 
              selectedClubRef.current
            );
          }
        )
        .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'club_chat_messages',
            filter: `club_id=eq.${club.id}`
          }, 
          (payload) => {
            console.log('[useClubMessageSubscriptions] Message deletion detected:', payload.old?.id);
            handleMessageDeletion(payload, setClubMessages);
          }
        )
        .subscribe((status) => {
          console.log(`[useClubMessageSubscriptions] Subscription status for club ${club.id}: ${status}`);
        });
      
      // Store the channel for cleanup
      clubChannels[club.id] = channel;
      
      // Mark this club as subscribed
      activeSubscriptionsRef.current[club.id] = true;
    });
    
    // Dispatch an event to notify that we're subscribed
    window.dispatchEvent(new CustomEvent('club-subscriptions-ready'));
    
    // Cleanup
    return () => {
      console.log('[useClubMessageSubscriptions] Cleaning up channels');
      
      // Remove each club channel
      Object.values(clubChannels).forEach(channel => {
        supabase.removeChannel(channel);
      });
      
      // Mark all clubs as unsubscribed
      const updatedSubs = { ...activeSubscriptionsRef.current };
      userClubs.forEach(club => {
        delete updatedSubs[club.id];
      });
      activeSubscriptionsRef.current = updatedSubs;
    };
  }, [isOpen, userClubs, currentUser?.id, setClubMessages]);
};
