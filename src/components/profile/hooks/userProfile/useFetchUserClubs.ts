
import { supabase } from '@/integrations/supabase/client';
import { Club, ClubMember } from '@/types';
import { transformRawMatchesToMatchType } from '@/utils/club/matchHistoryUtils';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useFetchUserClubs = async (userId: string) => {
  // Optimized query: fetch club memberships with club data in a single query
  const { data: membershipsWithClubs, error: membershipsError } = await supabase
    .from('club_members')
    .select(`
      club_id,
      is_admin,
      clubs (
        id, name, logo, division, tier, elite_points, bio
      )
    `)
    .eq('user_id', userId);

  if (membershipsError) {
    return { clubs: [], error: membershipsError };
  }

  // Early return if no memberships
  if (!membershipsWithClubs || membershipsWithClubs.length === 0) {
    return { clubs: [], error: null };
  }
  
  // Extract club IDs for batch operations
  const clubIds = membershipsWithClubs
    .map(m => m.clubs?.id)
    .filter(id => !!id) as string[];
  
  // Parallel fetch for club members and match history
  const [membersResult, matchesResult] = await Promise.all([
    // Get club members for all clubs in one query with nested user data
    supabase
      .from('club_members')
      .select(`
        club_id,
        user_id,
        is_admin,
        users (id, name, avatar)
      `)
      .in('club_id', clubIds),
    
    // Get match history for all clubs in one query
    supabase
      .from('matches')
      .select('*')
      .or(clubIds.map(id => `home_club_id.eq.${id},away_club_id.eq.${id}`).join(','))
      .order('end_date', { ascending: false })
  ]);

  // Process results into a map for easier lookup
  const membersByClubId: Record<string, ClubMember[]> = {};
  if (membersResult.data) {
    for (const member of membersResult.data) {
      if (!member.users || !member.club_id) continue;
      
      if (!membersByClubId[member.club_id]) {
        membersByClubId[member.club_id] = [];
      }
      
      membersByClubId[member.club_id].push({
        id: member.users.id,
        name: member.users.name || 'Unknown User',
        avatar: member.users.avatar || '/placeholder.svg',
        isAdmin: member.is_admin || false,
        distanceContribution: 0
      });
    }
  }

  // Process match data by club
  const matchesByClubId: Record<string, any[]> = {};
  if (matchesResult.data) {
    for (const match of matchesResult.data) {
      const homeClubId = match.home_club_id;
      const awayClubId = match.away_club_id;
      
      if (homeClubId && clubIds.includes(homeClubId)) {
        if (!matchesByClubId[homeClubId]) matchesByClubId[homeClubId] = [];
        matchesByClubId[homeClubId].push(match);
      }
      
      if (awayClubId && clubIds.includes(awayClubId)) {
        if (!matchesByClubId[awayClubId]) matchesByClubId[awayClubId] = [];
        matchesByClubId[awayClubId].push(match);
      }
    }
  }

  // Build the clubs array with the collected data
  const clubs: Club[] = [];
  
  for (const membership of membershipsWithClubs) {
    const clubData = membership.clubs;
    if (!clubData || !clubData.id) continue;
    
    const clubId = clubData.id;
    const members = membersByClubId[clubId] || [];
    const matchData = matchesByClubId[clubId] || [];
    const transformedMatches = transformRawMatchesToMatchType(matchData, clubId);
    
    clubs.push({
      id: clubId,
      name: clubData.name,
      logo: clubData.logo || '/placeholder.svg',
      division: ensureDivision(clubData.division),
      tier: clubData.tier || 1,
      elitePoints: clubData.elite_points || 0,
      members: members,
      matchHistory: transformedMatches,
      bio: clubData.bio || 'No description available'
    });
  }

  return { clubs, error: null };
};
