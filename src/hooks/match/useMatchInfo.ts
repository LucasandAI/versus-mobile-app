
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { Club, Match } from '@/types';
import { debounce } from 'lodash';
import { 
  transformMatchData, 
  getClubIdsString, 
  clearMatchCache 
} from '@/utils/match/matchTransformUtils';

export const useMatchInfo = (userClubs: Club[]) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Extract club IDs for efficient dependency tracking
  const clubIds = useMemo(() => getClubIdsString(userClubs), [userClubs]);

  // Optimized fetch function with minimal query fields
  const fetchMatches = useCallback(async (forceRefresh = false) => {
    if (!userClubs || userClubs.length === 0) {
      setMatches([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    // Clear cache if force refresh
    if (forceRefresh) {
      clearMatchCache();
    }
    
    try {
      const clubIdsList = userClubs.map(club => club.id).filter(Boolean);
      if (clubIdsList.length === 0) {
        setMatches([]);
        setIsLoading(false);
        return;
      }
      
      // Use a more efficient query with only necessary fields
      const { data, error } = await safeSupabase
        .from('view_full_match_info_v2')
        .select('*')
        .or(clubIdsList.map(id => `home_club_id.eq.${id},away_club_id.eq.${id}`).join(','))
        .order('end_date', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
        setIsLoading(false);
        return;
      }

      // Process each match with the shared utility function
      const transformedMatches: Match[] = (data as any[] || []).map((r) => {
        const parseMembers = (membersJson: any) => {
          if (!membersJson) return [];
          const arr = typeof membersJson === 'string' ? JSON.parse(membersJson) : membersJson;
          return (Array.isArray(arr) ? arr : Object.values(arr)).map((m: any) => ({
            id: m.user_id,
            name: m.name || 'Unknown',
            avatar: m.avatar || '/placeholder.svg',
            distanceContribution: Number(m.distance_km ?? 0),
          }));
        };
        return {
          id: r.match_id,
          homeClub: {
            id: r.home_club_id,
            name: r.home_club_name,
            logo: r.home_club_logo || '/placeholder.svg',
            members: parseMembers(r.home_club_members),
            totalDistance: Number(r.home_total_distance ?? 0),
          },
          awayClub: {
            id: r.away_club_id,
            name: r.away_club_name,
            logo: r.away_club_logo || '/placeholder.svg',
            members: parseMembers(r.away_club_members),
            totalDistance: Number(r.away_total_distance ?? 0),
          },
          startDate: r.start_date,
          endDate: r.end_date,
          status: r.status,
          winner: r.winner,
          leagueBeforeMatch: r.league_before_match,
          leagueAfterMatch: r.league_after_match,
        } as Match;
      });
      
      // Keep only active matches for homepage display
      setMatches(transformedMatches.filter(m => m.status === 'active'));
    } catch (error) {
      console.error('Error processing matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [clubIds]); // Depend only on club IDs instead of full objects

  // Reduced debounce time from 300ms to 50ms for faster response
  const debouncedFetchMatches = useMemo(() => 
    debounce(fetchMatches, 50), 
  [fetchMatches]);

  useEffect(() => {
    debouncedFetchMatches();
    
    // Set up realtime subscription for matches with immediate return
    const matchChannel = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches'
        },
        () => {
          debouncedFetchMatches();
        }
      )
      .subscribe();
    
    // Removed legacy distance table subscription to reduce flicker

    // Listen for custom events
    const handleMatchEvent = () => {
      debouncedFetchMatches(true); // Force refresh on manual events
    };

    window.addEventListener('matchCreated', handleMatchEvent);
    window.addEventListener('matchUpdated', handleMatchEvent);
    window.addEventListener('matchEnded', handleMatchEvent);
      
    // Clean up
    return () => {
      debouncedFetchMatches.cancel();
      supabase.removeChannel(matchChannel);
      // no distanceChannel to remove
      window.removeEventListener('matchCreated', handleMatchEvent);
      window.removeEventListener('matchUpdated', handleMatchEvent);
      window.removeEventListener('matchEnded', handleMatchEvent);
    };
  }, [debouncedFetchMatches]);

  return {
    matches,
    isLoading,
    refreshMatches: useCallback(() => fetchMatches(true), [fetchMatches])
  };
};
