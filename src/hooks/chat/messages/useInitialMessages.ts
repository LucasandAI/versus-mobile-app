
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';

export const useInitialMessages = (
  userClubs: Club[],
  isOpen: boolean,
  setClubMessages: React.Dispatch<React.SetStateAction<Record<string, any[]>>>
) => {
  const [hasLoadedMessages, setHasLoadedMessages] = useState<Record<string, boolean>>({});
  const { currentUser, isSessionReady } = useApp();
  
  useEffect(() => {
    // Skip if not authenticated, session not ready, drawer is closed, or no clubs
    if (!isSessionReady || !currentUser?.id || !isOpen || !userClubs.length) return;

    const fetchClubMessages = async () => {
      console.log('[useInitialMessages] Fetching messages for all clubs');
      
      try {
        const messagesPromises = userClubs.map(async (club) => {
          const clubId = club.id;
          
          // Skip loading if already loaded for this session
          if (hasLoadedMessages[clubId]) {
            console.log(`[useInitialMessages] Already loaded messages for club ${clubId}`);
            return [clubId, null];
          }
          
          console.log(`[useInitialMessages] Fetching messages for club ${clubId}`);
          
          // Using select with join for better efficiency
          const { data, error } = await supabase
            .from('club_chat_messages')
            .select(`
              id, 
              message, 
              timestamp, 
              sender_id, 
              club_id,
              sender:sender_id(id, name, avatar)
            `)
            .eq('club_id', clubId)
            .order('timestamp', { ascending: true });
              
          if (error) {
            console.error(`[useInitialMessages] Error fetching messages for club ${clubId}:`, error);
            return [clubId, []];
          }
          
          // Mark as loaded
          setHasLoadedMessages(prev => ({
            ...prev, 
            [clubId]: true
          }));
          
          console.log(`[useInitialMessages] Loaded ${data?.length || 0} messages for club ${clubId}`);
          return [clubId, data || []];
        });
        
        const messagesResults = await Promise.all(messagesPromises);
        
        // Update state with all fetched messages in a single update
        setClubMessages(prevMessages => {
          const updatedMessages = { ...prevMessages };
          
          messagesResults.forEach(([clubId, messages]) => {
            if (typeof clubId === 'string' && messages !== null) {
              updatedMessages[clubId] = Array.isArray(messages) ? messages : [];
              console.log(`[useInitialMessages] Updated club ${clubId} with ${updatedMessages[clubId].length} messages`);
            }
          });
          
          return updatedMessages;
        });
      } catch (error) {
        console.error('[useInitialMessages] Error fetching club messages:', error);
        toast({
          title: "Error",
          description: "Failed to load chat messages",
          variant: "destructive"
        });
      }
    };
    
    fetchClubMessages();
  }, [userClubs, isOpen, setClubMessages, hasLoadedMessages, currentUser?.id, isSessionReady]);

  // Reset loaded state when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setHasLoadedMessages({});
    }
  }, [isOpen]);
};
