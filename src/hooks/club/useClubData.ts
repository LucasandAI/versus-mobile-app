import { useState, useEffect, useCallback } from 'react';
import { Club, Match, ClubMember } from '@/types';
import { useClubDetails } from './useClubDetails';
import { useClubMembers } from './useClubMembers';
import { useClubMatches } from './useClubMatches';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useClubData = (clubId: string | undefined) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [club, setClub] = useState<Club | null>(null);
  const { setSelectedClub } = useApp();

  const { fetchClubDetails } = useClubDetails(clubId);
  const { fetchClubMembers } = useClubMembers();
  const { fetchClubMatches } = useClubMatches();

  // Fetch active match separately
  const fetchActiveMatch = async (clubId: string): Promise<Match | null> => {
    try {
      console.log('[fetchActiveMatch] Fetching active match for club:', clubId);
      const { data, error } = await supabase
        .from('view_full_match_info')
        .select('*')
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('[fetchActiveMatch] Error:', error);
        return null;
      }
      
      if (!data) {
        console.log('[fetchActiveMatch] No active match found');
        return null;
      }

      console.log('[fetchActiveMatch] Raw match data:', data);

      // Use same parsing logic as in useMatchInfo
      const isHomeTeam = data.home_club_id === clubId;

      const parseMembers = (membersJson: any) => {
        if (!membersJson) return [];
        
        try {
          const parsedMembers = typeof membersJson === 'string' 
            ? JSON.parse(membersJson) 
            : membersJson;
            
          const membersArray = Array.isArray(parsedMembers) 
            ? parsedMembers 
            : Object.values(parsedMembers);
          
          return membersArray.map((member: any) => ({
            id: member.user_id,
            name: member.name || 'Unknown',
            avatar: member.avatar || '/placeholder.svg',
            isAdmin: member.is_admin || false,
            distanceContribution: parseFloat(String(member.distance || '0'))
          }));
        } catch (error) {
          console.error('Error parsing members JSON:', error);
          return [];
        }
      };

      const homeMembers = parseMembers(data.home_club_members);
      const awayMembers = parseMembers(data.away_club_members);
      
      const homeTotalDistance = data.home_total_distance !== null ? 
        parseFloat(String(data.home_total_distance)) : 
        homeMembers.reduce((sum, member) => sum + (member.distanceContribution || 0), 0);
        
      const awayTotalDistance = data.away_total_distance !== null ? 
        parseFloat(String(data.away_total_distance)) : 
        awayMembers.reduce((sum, member) => sum + (member.distanceContribution || 0), 0);

      const match: Match = {
        id: data.match_id,
        homeClub: {
          id: data.home_club_id,
          name: data.home_club_name || "Unknown Team",
          logo: data.home_club_logo || '/placeholder.svg',
          division: ensureDivision(data.home_club_division), // Use ensureDivision to get a valid Division type
          tier: Number(data.home_club_tier || 1),
          totalDistance: homeTotalDistance,
          members: homeMembers
        },
        awayClub: {
          id: data.away_club_id,
          name: data.away_club_name || "Unknown Team", 
          logo: data.away_club_logo || '/placeholder.svg',
          division: ensureDivision(data.away_club_division), // Use ensureDivision to get a valid Division type
          tier: Number(data.away_club_tier || 1),
          totalDistance: awayTotalDistance,
          members: awayMembers
        },
        startDate: data.start_date,
        endDate: data.end_date,
        status: data.status as 'active' | 'completed',
        winner: data.winner as 'home' | 'away' | 'draw' | undefined
      };
      
      console.log('[fetchActiveMatch] Processed match data:', match);
      return match;
    } catch (error) {
      console.error('[fetchActiveMatch] Error:', error);
      return null;
    }
  };

  const loadClubData = useCallback(async () => {
    if (!clubId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch basic club data
      const clubData = await fetchClubDetails();
      if (!clubData) {
        throw new Error('Could not fetch club details');
      }
      
      console.log('[useClubData] Basic club data fetched:', clubData);
      
      // Fetch members, matches, and active match in parallel
      const [members, matches, activeMatch] = await Promise.all([
        fetchClubMembers(clubId),
        fetchClubMatches(clubId),
        fetchActiveMatch(clubId)
      ]);
      
      console.log('[useClubData] Members fetched:', members);
      console.log('[useClubData] Matches fetched:', matches);
      console.log('[useClubData] Active match fetched:', activeMatch);
      
      // Create the final club object with safe defaults
      const updatedClub: Club = {
        ...clubData,
        members: members || [],
        matchHistory: matches || [],
        currentMatch: activeMatch
      };
      
      console.log('[useClubData] Complete club object created:', updatedClub);
      
      // Update local state and global context with the hydrated club
      setClub(updatedClub);
      
      // Update global context with the fully hydrated club
      setSelectedClub(updatedClub);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error loading club data';
      console.error('[useClubData] Error:', message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [clubId, fetchClubDetails, fetchClubMembers, fetchClubMatches, setSelectedClub]);

  useEffect(() => {
    loadClubData();
    
    // Add event listeners for data updates
    const handleDataUpdate = () => {
      console.log('[useClubData] userDataUpdated event received, refreshing data');
      loadClubData();
    };

    const handleClubMembershipChange = (event: CustomEvent) => {
      if (event.detail?.clubId === clubId) {
        console.log('[useClubData] clubMembershipChanged event for this club received, refreshing data');
        loadClubData();
      }
    };

    const handleMatchEnded = () => {
      console.log('[useClubData] matchEnded event received, refreshing data');
      loadClubData();
    };

    window.addEventListener('userDataUpdated', handleDataUpdate);
    window.addEventListener('clubMembershipChanged', handleClubMembershipChange as EventListener);
    window.addEventListener('matchEnded', handleMatchEnded);
    
    // Set up Supabase realtime subscription for club_members table
    const clubMembershipChannel = supabase
      .channel('club-data-membership-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `club_id=eq.${clubId}`
        },
        () => {
          console.log('[useClubData] Realtime update detected for club members');
          loadClubData();
        }
      )
      .subscribe();

    // Set up Supabase realtime subscription for matches table
    const matchesChannel = supabase
      .channel('club-data-matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `home_club_id=eq.${clubId},away_club_id=eq.${clubId}`
        },
        () => {
          console.log('[useClubData] Realtime update detected for matches');
          loadClubData();
        }
      )
      .subscribe();
    
    // Set up Supabase realtime subscription for match_distances table
    const distancesChannel = supabase
      .channel('club-data-distances-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_distance_contributions'
        },
        (payload) => {
          console.log('[useClubData] Realtime update detected for distances:', payload);
          loadClubData();
        }
      )
      .subscribe();
    
    return () => {
      window.removeEventListener('userDataUpdated', handleDataUpdate);
      window.removeEventListener('clubMembershipChanged', handleClubMembershipChange as EventListener);
      window.removeEventListener('matchEnded', handleMatchEnded);
      supabase.removeChannel(clubMembershipChannel);
      supabase.removeChannel(matchesChannel);
      supabase.removeChannel(distancesChannel);
    };
  }, [loadClubData, clubId]);

  return { club, isLoading, error, refreshClubData: loadClubData };
};
