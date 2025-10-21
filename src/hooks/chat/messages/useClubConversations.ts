
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { Club } from '@/types';

export interface ClubConversation {
  club: Club;
  lastMessage?: {
    message: string;
    sender_id?: string; // Added sender_id for direct access
    sender?: {
      id: string;
      name: string;
      avatar?: string;
    };
    sender_username?: string;
    timestamp: string;
  } | null;
}

interface MessagePayload {
  new: {
    id: string;
    club_id: string;
    message: string;
    sender_id: string;
    timestamp: string;
    [key: string]: any;
  };
}

export const useClubConversations = (clubs: Club[]): ClubConversation[] => {
  const [clubConversations, setClubConversations] = useState<ClubConversation[]>([]);
  const [lastMessages, setLastMessages] = useState<Record<string, any>>({});
  const clubsRef = useRef<Club[]>(clubs);
  const [isLoading, setIsLoading] = useState(false);

  // Update the reference when clubs change
  useEffect(() => {
    clubsRef.current = clubs;
  }, [clubs]);

  // Fetch last messages for all clubs on mount and when clubs change
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (clubs.length === 0) return;

      setIsLoading(true);
      try {
        // Use a more efficient query to get only 1 message per club
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
              sender:sender_id(id, name, avatar)
            `)
            .eq('club_id', clubId)
            .order('timestamp', { ascending: false })
            .limit(1)
        );
        
        // Run queries in parallel
        const results = await Promise.all(queries);
        
        // Process results
        const clubLastMessages: Record<string, any> = {};
        results.forEach((result, index) => {
          const { data, error } = result;
          if (error) {
            console.error(`Error fetching club messages for ${clubIds[index]}:`, error);
          } else if (data && data.length > 0) {
            clubLastMessages[clubIds[index]] = data[0];
          }
        });

        setLastMessages(clubLastMessages);
      } catch (error) {
        console.error('Failed to fetch last messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLastMessages();
  }, [clubs]);

  // Subscribe to realtime updates for club messages
  useEffect(() => {
    if (clubs.length === 0) return;
    
    const clubIds = clubs.map(club => club.id);
    const channel = supabase
      .channel('club-messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'club_chat_messages',
          filter: `club_id=in.(${clubIds.join(',')})`
        }, 
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Type guard to check if payload has correct structure
          if (payload && payload.new && 'club_id' in payload.new) {
            const typedPayload = payload as unknown as MessagePayload;
            const clubId = typedPayload.new.club_id;
            
            console.log('[useClubConversations] Realtime update for club:', clubId);

            // Update with the new message immediately
            const newMessage = {
              ...typedPayload.new,
              // Add a temporary sender object that will be replaced when we fetch the real data
              sender: {
                id: typedPayload.new.sender_id,
                name: 'Loading...',
                avatar: undefined
              }
            };
            
            setLastMessages(prev => ({
              ...prev,
              [clubId]: newMessage
            }));
            
            // Fetch the actual sender details
            supabase
              .from('users')
              .select('id, name, avatar')
              .eq('id', typedPayload.new.sender_id)
              .single()
              .then(({ data, error }) => {
                if (!error && data) {
                  // Update with complete sender data
                  setLastMessages(prev => {
                    // Make sure we're still dealing with the same message
                    const currentMsg = prev[clubId];
                    // Check if currentMsg and newMessage exists and have ids to compare
                    if (currentMsg && newMessage.id && currentMsg.id === newMessage.id) {
                      return {
                        ...prev,
                        [clubId]: {
                          ...currentMsg,
                          sender: data
                        }
                      };
                    }
                    return prev;
                  });
                }
              });
          }
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubs]);

  // Combine clubs with their last messages
  useEffect(() => {
    const conversations: ClubConversation[] = clubs.map(club => {
      const lastMessage = lastMessages[club.id];
      return {
        club,
        lastMessage: lastMessage ? {
          message: lastMessage.message,
          sender_id: lastMessage.sender_id, // Added sender_id
          sender: lastMessage.sender,
          sender_username: lastMessage.sender?.name || 'Unknown',
          timestamp: lastMessage.timestamp
        } : null
      };
    });

    setClubConversations(conversations);
  }, [clubs, lastMessages]);

  return clubConversations;
};
