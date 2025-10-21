
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseFetchUnreadCountsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  setDmUnreadCount: (count: number) => void;
  setClubUnreadCount: (count: number) => void;
  setUnreadConversations: (unread: Set<string>) => void;
  setUnreadClubs: (unread: Set<string>) => void;
  setUnreadMessagesPerConversation: (countMap: Record<string, number>) => void;
  setUnreadMessagesPerClub: (countMap: Record<string, number>) => void;
}

export const useFetchUnreadCounts = ({
  currentUserId,
  isSessionReady,
  setDmUnreadCount,
  setClubUnreadCount,
  setUnreadConversations,
  setUnreadClubs,
  setUnreadMessagesPerConversation,
  setUnreadMessagesPerClub
}: UseFetchUnreadCountsProps) => {
  
  const fetchUnreadCounts = useCallback(async () => {
    if (!isSessionReady || !currentUserId) return;
    
    try {
      console.log('[useFetchUnreadCounts] Fetching unread counts');
      
      // Use Promise.all to parallelize the database queries for performance
      const [dmCountResult, clubCountResult, directMessagesResult, clubMembersResult] = await Promise.all([
        // 1. Fetch DM unread counts using the RPC function
        supabase.rpc('get_unread_dm_count', {
          user_id: currentUserId
        }),
        
        // 2. Fetch club unread counts using the RPC function
        supabase.rpc('get_unread_club_messages_count', {
          user_id: currentUserId
        }),
        
        // 3. Query unread direct messages using the unread_by field
        supabase
          .from('direct_messages')
          .select('id, conversation_id, timestamp')
          .contains('unread_by', [currentUserId]),
          
        // 4. Get user's clubs
        supabase
          .from('club_members')
          .select('club_id')
          .eq('user_id', currentUserId)
      ]);
      
      // Handle errors for each query
      if (dmCountResult.error) throw dmCountResult.error;
      if (clubCountResult.error) throw clubCountResult.error;
      if (directMessagesResult.error) throw directMessagesResult.error;
      if (clubMembersResult.error) throw clubMembersResult.error;
      
      // Set total counts
      setDmUnreadCount(dmCountResult.data || 0);
      setClubUnreadCount(clubCountResult.data || 0);
      
      // Process direct messages results
      const unreadConvs = new Set<string>();
      const messagesPerConversation: Record<string, number> = {};
      
      directMessagesResult.data?.forEach(msg => {
        if (msg.conversation_id) {
          unreadConvs.add(msg.conversation_id);
          // Count unread messages per conversation
          messagesPerConversation[msg.conversation_id] = (messagesPerConversation[msg.conversation_id] || 0) + 1;
        }
      });
      
      setUnreadConversations(unreadConvs);
      setUnreadMessagesPerConversation(messagesPerConversation);
      
      // If no club memberships, reset club unread state and exit
      const clubIds = clubMembersResult.data?.map(member => member.club_id) || [];
      if (!clubIds.length) {
        setUnreadClubs(new Set());
        setUnreadMessagesPerClub({});
        return;
      }
      
      console.log('[useFetchUnreadCounts] User club IDs:', clubIds);
      
      // Query unread club messages using the unread_by field
      const { data: clubMessages, error: clubMessagesError } = await supabase
        .from('club_chat_messages')
        .select('id, club_id')
        .in('club_id', clubIds)
        .contains('unread_by', [currentUserId]);
        
      if (clubMessagesError) {
        console.error('[useFetchUnreadCounts] Error fetching club messages:', clubMessagesError);
      }
      
      console.log('[useFetchUnreadCounts] Unread club messages found:', clubMessages?.length || 0);
      
      // Count unread club messages per club
      const unreadClubsSet = new Set<string>();
      const messagesPerClub: Record<string, number> = {};
      
      clubMessages?.forEach(msg => {
        if (msg.club_id) {
          unreadClubsSet.add(msg.club_id);
          messagesPerClub[msg.club_id] = (messagesPerClub[msg.club_id] || 0) + 1;
        }
      });
      
      console.log('[useFetchUnreadCounts] Unread clubs set:', Array.from(unreadClubsSet));
      setUnreadClubs(unreadClubsSet);
      setUnreadMessagesPerClub(messagesPerClub);
      
      console.log('[useFetchUnreadCounts] Unread counts fetched:', { 
        dmCount: dmCountResult.data, 
        clubCount: clubCountResult.data,
        unreadConversations: unreadConvs.size,
        unreadClubs: unreadClubsSet.size,
        messagesPerConversation,
        messagesPerClub
      });
      
      // Use requestAnimationFrame to improve UI responsiveness when updating unread counts
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      });
      
    } catch (error) {
      console.error('[useFetchUnreadCounts] Error fetching unread counts:', error);
    }
  }, [currentUserId, isSessionReady, setDmUnreadCount, setClubUnreadCount, setUnreadConversations, setUnreadClubs, setUnreadMessagesPerConversation, setUnreadMessagesPerClub]);

  return { fetchUnreadCounts };
};
