import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { MessageSender } from '@/types/chat';

interface ClubMessage {
  id: string;
  message: string;
  sender_id: string;
  club_id: string;
  timestamp: string;
  sender?: MessageSender;
  [key: string]: any;
}

interface MessagePayload {
  new: {
    id: string;
    club_id: string;
    message: string;
    sender_id: string;
    timestamp: string;
    sender_name?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export const useClubLastMessages = (clubs: Club[]) => {
  const [lastMessages, setLastMessages] = useState<Record<string, ClubMessage>>({});
  const [isLoading, setIsLoading] = useState(false);
  const clubsRef = useRef<Club[]>(clubs);
  const { currentUser } = useApp();
  const [senderCache, setSenderCache] = useState<Record<string, {name: string, avatar?: string}>>({});
  const lastUpdateTimestamp = useRef<Record<string, number>>({});
  
  // Update the reference when clubs change
  useEffect(() => {
    clubsRef.current = clubs;
  }, [clubs]);

  // Force re-render when messages change
  const forceUpdate = useCallback((clubId: string) => {
    // Track the last update timestamp to avoid too frequent re-renders
    const now = Date.now();
    if (now - (lastUpdateTimestamp.current[clubId] || 0) < 500) {
      return; // Skip updates that are too close together
    }
    lastUpdateTimestamp.current[clubId] = now;
    
    // Force update by creating a new object with the same data
    setLastMessages(prev => ({...prev}));
    
    // Dispatch a global event for components that might need to update
    window.dispatchEvent(new CustomEvent('clubMessagesUpdated', {
      detail: { clubId }
    }));
  }, []);

  // Pre-load all user data for caching
  useEffect(() => {
    const fetchAllSenderData = async () => {
      if (clubs.length === 0) return;
      
      try {
        // Get all unique sender IDs from last messages
        const senderIds = Object.values(lastMessages)
          .map(msg => msg.sender_id)
          .filter(id => id && !senderCache[id]) // Skip already cached and null IDs
          .filter((id, index, array) => array.indexOf(id) === index); // Unique only
        
        if (senderIds.length === 0) return;
        
        const { data } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', senderIds);
          
        if (data && data.length > 0) {
          const newCache = { ...senderCache };
          data.forEach(user => {
            newCache[user.id] = { name: user.name, avatar: user.avatar };
          });
          setSenderCache(newCache);
        }
      } catch (error) {
        console.error('Failed to fetch sender details:', error);
      }
    };
    
    fetchAllSenderData();
  }, [lastMessages, clubs, senderCache]);

  // Fetch last messages for all clubs on mount and when clubs change
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (clubs.length === 0) return;

      setIsLoading(true);
      try {
        console.log('[useClubLastMessages] Fetching initial last messages for clubs:', clubs.map(c => c.id));
        
        // Use the view to get last messages with sender names
        const clubIds = clubs.map(club => club.id);
        const queries = clubIds.map(clubId => 
          supabase
            .from('club_chat_messages')
            .select(`
              id, 
              message, 
              sender_id, 
              club_id, 
              timestamp,
              sender:sender_id (
                id, 
                name, 
                avatar
              )
            `)
            .eq('club_id', clubId)
            .order('timestamp', { ascending: false })
            .limit(1)
        );
        
        // Run queries in parallel
        const results = await Promise.all(queries);
        
        // Process results
        const clubLastMessages: Record<string, ClubMessage> = {};
        results.forEach((result, index) => {
          const { data, error } = result;
          if (error) {
            console.error(`Error fetching club messages for ${clubIds[index]}:`, error);
          } else if (data && data.length > 0) {
            // Map from view structure to ClubMessage structure
            clubLastMessages[clubIds[index]] = {
              id: data[0].id,
              message: data[0].message,
              sender_id: data[0].sender_id,
              club_id: data[0].club_id,
              timestamp: data[0].timestamp,
              sender: data[0].sender || {
                id: data[0].sender_id,
                name: 'Unknown',
                avatar: undefined
              }
            };
          }
        });

        setLastMessages(prev => ({...prev, ...clubLastMessages}));
        console.log('[useClubLastMessages] Initial last messages fetched:', Object.keys(clubLastMessages).length);
      } catch (error) {
        console.error('Failed to fetch last messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastMessages();
  }, [clubs]);

  // Subscribe to real-time updates for club messages
  useEffect(() => {
    if (clubs.length === 0) return;
    
    const clubIds = clubs.map(club => club.id);
    console.log('[useClubLastMessages] Setting up subscription for clubs:', clubIds);
    
    // Use a listener that works with the original table, not the view
    const channel = supabase
      .channel('club-last-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages',
          filter: clubIds.length > 0 ? `club_id=in.(${clubIds.join(',')})` : undefined
        }, 
        async (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('[useClubLastMessages] Received real-time message:', payload);
          
          // Type guard to check if payload has correct structure
          if (!payload || !payload.new || !payload.new.club_id) {
            console.log('[useClubLastMessages] Invalid payload received:', payload);
            return;
          }
          
          const typedPayload = payload as unknown as MessagePayload;
          const clubId = typedPayload.new.club_id;
          const isCurrentUser = typedPayload.new.sender_id === currentUser?.id;
          
          // Check if this club is relevant to the user
          const isRelevantClub = clubsRef.current.some(club => club.id === clubId);
          if (!isRelevantClub) return;

          console.log(`[useClubLastMessages] New message for club ${clubId}: ${typedPayload.new.message}`);
          
          // We need to fetch the sender info if it's not the current user
          let senderInfo: MessageSender = { 
            id: typedPayload.new.sender_id,
            name: isCurrentUser ? 'You' : 'Unknown'
          };
          
          // If it's not the current user and we have cached sender info, use it
          if (!isCurrentUser && senderCache[typedPayload.new.sender_id]) {
            senderInfo = {
              id: typedPayload.new.sender_id,
              name: senderCache[typedPayload.new.sender_id].name,
              avatar: senderCache[typedPayload.new.sender_id].avatar
            };
          }
          // If it's not cached and not current user, fetch sender info
          else if (!isCurrentUser) {
            try {
              const { data } = await supabase
                .from('users')
                .select('id, name, avatar')
                .eq('id', typedPayload.new.sender_id)
                .single();
                
              if (data) {
                senderInfo = {
                  id: data.id,
                  name: data.name,
                  avatar: data.avatar
                };
                
                // Update sender cache
                setSenderCache(prev => ({
                  ...prev,
                  [data.id]: { name: data.name, avatar: data.avatar }
                }));
              }
            } catch (error) {
              console.error('[useClubLastMessages] Error fetching sender:', error);
            }
          }
          
          // Create a message with sender info
          const newMessage: ClubMessage = {
            id: typedPayload.new.id,
            message: typedPayload.new.message,
            sender_id: typedPayload.new.sender_id,
            club_id: typedPayload.new.club_id,
            timestamp: typedPayload.new.timestamp,
            sender: senderInfo
          };
          
          // Update with the new message
          setLastMessages(prev => ({
            ...prev,
            [clubId]: newMessage
          }));
          
          // Force re-render for this club
          forceUpdate(clubId);
        })
      .subscribe((status) => {
        console.log('[useClubLastMessages] Subscription status:', status);
      });

    return () => {
      console.log('[useClubLastMessages] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [clubs, currentUser?.id, senderCache, forceUpdate]);

  return {
    lastMessages,
    isLoading,
    senderCache
  };
};
