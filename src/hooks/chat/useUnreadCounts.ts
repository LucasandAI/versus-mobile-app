
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/context/AppContext';

export const useUnreadCounts = () => {
  const [dmUnreadCount, setDMUnreadCount] = useState(0);
  const [clubUnreadCount, setClubUnreadCount] = useState(0);
  const [unreadConversations, setUnreadConversations] = useState<Set<string>>(new Set());
  const [unreadClubs, setUnreadClubs] = useState<Set<string>>(new Set());
  
  const { currentUser, isSessionReady } = useApp();
  const userId = currentUser?.id;

  // Mark club messages as read
  const markClubMessagesAsRead = useCallback(async (clubId: string) => {
    if (!userId) return;
    
    // Optimistic update of UI
    setUnreadClubs(prev => {
      const updated = new Set(prev);
      updated.delete(clubId);
      return updated;
    });
    
    setClubUnreadCount(prev => Math.max(0, prev - 1));
    
    // Dispatch event to update global unread count
    window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
    
    try {
      // Use RPC function to mark club messages as read
      const { error } = await supabase.rpc(
        'mark_club_as_read', 
        { 
          p_club_id: clubId,
          p_user_id: userId
        }
      );
      
      if (error) throw error;
      
    } catch (error) {
      console.error('[useUnreadCounts] Error marking club messages as read:', error);
      
      // Revert optimistic update on error
      setUnreadClubs(prev => {
        const reverted = new Set(prev);
        reverted.add(clubId);
        return reverted;
      });
      
      setClubUnreadCount(prev => prev + 1);
    }
  }, [userId]);

  useEffect(() => {
    // Skip if not authenticated or session not ready
    if (!isSessionReady || !userId) return;

    const fetchUnreadCounts = async () => {
      try {
        // Fetch DM unread counts
        const { data: dmCount, error: dmError } = await supabase.rpc('get_unread_dm_count', {
          user_id: userId
        });
        
        if (dmError) throw dmError;
        setDMUnreadCount(dmCount || 0);

        // Fetch club unread counts
        const { data: clubCount, error: clubError } = await supabase.rpc('get_unread_club_messages_count', {
          user_id: userId
        });
        
        if (clubError) throw clubError;
        setClubUnreadCount(clubCount || 0);

        // Get unread conversations by querying direct messages
        const { data: unreadDMs, error: unreadDMsError } = await supabase
          .from('direct_messages')
          .select('conversation_id')
          .contains('unread_by', [userId])
          .order('timestamp', { ascending: false });

        if (unreadDMsError) throw unreadDMsError;

        if (unreadDMs && unreadDMs.length > 0) {
          // Extract unique conversation IDs
          const conversationIds = new Set(unreadDMs.map(dm => dm.conversation_id));
          setUnreadConversations(conversationIds);
        } else {
          setUnreadConversations(new Set());
        }

        // Get unread clubs by querying club messages
        const { data: unreadClubMessages, error: unreadClubsError } = await supabase
          .from('club_chat_messages')
          .select('club_id')
          .contains('unread_by', [userId])
          .order('timestamp', { ascending: false });

        if (unreadClubsError) throw unreadClubsError;

        if (unreadClubMessages && unreadClubMessages.length > 0) {
          // Extract unique club IDs
          const clubIds = new Set(unreadClubMessages.map(msg => msg.club_id));
          setUnreadClubs(clubIds);
        } else {
          setUnreadClubs(new Set());
        }
      } catch (error) {
        console.error('[useUnreadCounts] Error fetching unread counts:', error);
      }
    };

    fetchUnreadCounts();

    // Only set up subscriptions when authenticated
    const dmChannel = supabase.channel('dm-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages'
      }, (payload) => {
        if (payload.new.receiver_id === userId) {
          setDMUnreadCount(prev => prev + 1);
          setUnreadConversations(prev => new Set([...prev, payload.new.conversation_id]));
          
          // Dispatch global event to notify other parts of the app
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
        }
      })
      .subscribe();

    const clubChannel = supabase.channel('club-notifications')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_chat_messages'
        },
        (payload) => {
          if (payload.new.sender_id !== userId) {
            setClubUnreadCount(prev => prev + 1);
            setUnreadClubs(prev => new Set([...prev, payload.new.club_id]));
            
            // Dispatch global event to notify other parts of the app
            window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
            window.dispatchEvent(new CustomEvent('clubMessageReceived', { 
              detail: { clubId: payload.new.club_id } 
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
    };
  }, [userId, isSessionReady]);

  return {
    totalUnreadCount: dmUnreadCount + clubUnreadCount,
    dmUnreadCount,
    clubUnreadCount,
    unreadConversations,
    unreadClubs,
    markClubMessagesAsRead
  };
};
