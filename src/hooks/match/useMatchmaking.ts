import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useMatchmaking = (currentUser: any) => {
  const [isSearching, setIsSearching] = useState(false);
  
  const isClubAdmin = (clubId: string): boolean => {
    if (!currentUser?.clubs) return false;
    
    const club = currentUser.clubs.find((c: any) => c.id === clubId);
    return club?.members?.some((m: any) => m.id === currentUser.id && m.isAdmin) || false;
  };

  const hasEnoughMembers = (clubId: string): boolean => {
    if (!currentUser?.clubs) return false;
    
    const club = currentUser.clubs.find((c: any) => c.id === clubId);
    return club?.members && club.members.length >= 5;
  };

  const isAlreadyInQueue = async (clubId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('matchmaking_queue')
      .select('club_id')
      .eq('club_id', clubId)
      .single();
      
    return !!data;
  };

  const hasActiveMatch = async (clubId: string): Promise<boolean> => {
    const { data } = await supabase
      .from('view_full_match_info')
      .select('match_id')
      .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
      .eq('status', 'active')
      .maybeSingle();
      
    return !!data;
  };

  const searchForOpponent = async (clubId: string, division: string, tier: number) => {
    if (!isClubAdmin(clubId)) {
      toast.error("Only club admins can search for opponents");
      return false;
    }

    if (!hasEnoughMembers(clubId)) {
      toast.error("Your club needs at least 5 members to compete");
      return false;
    }

    try {
      setIsSearching(true);
      
      // Check if already in queue
      const inQueue = await isAlreadyInQueue(clubId);
      if (inQueue) {
        toast.info("Your club is already searching for an opponent");
        setIsSearching(false);
        return true;
      }
      
      // Check if already in an active match
      const inMatch = await hasActiveMatch(clubId);
      if (inMatch) {
        toast.info("Your club is already in an active match");
        setIsSearching(false);
        return false;
      }

      // Add club to matchmaking queue
      const { error } = await supabase
        .from('matchmaking_queue')
        .insert({
          club_id: clubId,
          division: division,
          tier: tier
        });

      if (error) {
        console.error('Error adding to matchmaking queue:', error);
        toast.error("Failed to search for opponent");
        setIsSearching(false);
        return false;
      }

      toast.success("Searching for an opponent...");
      
      // Set up a listener for new matches
      const matchSubscription = supabase
        .channel(`club-match-${clubId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'matches',
            filter: `home_club_id=eq.${clubId},away_club_id=eq.${clubId}`
          },
          (payload) => {
            if (payload.new) {
              toast.success("Match found! Preparing the match...");
              setIsSearching(false);
              window.dispatchEvent(new CustomEvent('matchCreated'));
            }
          }
        )
        .subscribe();

      return true;
    } catch (error) {
      console.error('Error searching for opponent:', error);
      toast.error("An error occurred while searching for an opponent");
      setIsSearching(false);
      return false;
    }
  };

  return {
    isSearching,
    searchForOpponent,
    isClubAdmin,
    hasEnoughMembers
  };
};
