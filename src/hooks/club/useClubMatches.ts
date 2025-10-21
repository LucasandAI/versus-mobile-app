
import { Match, ClubMember } from '@/types';
import { safeSupabase } from '@/integrations/supabase/safeClient';

interface ClubContribution {
  club: {
    id: string;
    name: string;
  };
  totalDistance: number;
  userContributions: Array<{
    user_id: string;
    user_name: string;
    distance_meters: number;
    contribution_date: string;
    created_at: string;
  }>;
  contributingUsersCount: number;
  firstContributionDate: string;
  lastContributionDate: string;
}

interface MatchData {
  match_id: string;
  home_club_id: string;
  home_club_name: string;
  home_club_logo?: string;
  home_score?: number;
  away_club_id: string;
  away_club_name: string;
  away_club_logo?: string;
  away_score?: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed';
  winner?: 'home' | 'away' | 'draw';
  club_id?: string;
  club_name?: string;
  total_club_distance?: string | number;
  user_contributions?: any;
  contributing_users_count?: number | string;
  first_contribution_date?: string;
  last_contribution_date?: string;
  league_before_match?: any;
  league_after_match?: any;
}

export const useClubMatches = () => {
  const fetchClubMatches = async (clubId: string): Promise<Match[]> => {
    // Fetch match history from the new consolidated view
    const { data: rows, error } = await safeSupabase
      .from('view_full_match_info_v2')
      .select('*')
      .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
      .eq('status', 'completed')
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching match history:', error);
      throw new Error('Error fetching match history: ' + error.message);
    }

    const matches: Match[] = [];
    for (const r of (rows as any[]) ?? []) {
      // Parse members JSON arrays
      const parseMembers = (membersJson: any) => {
        if (!membersJson) return [] as ClubMember[];
        const arr = typeof membersJson === 'string' ? JSON.parse(membersJson) : membersJson;
        return (Array.isArray(arr) ? arr : Object.values(arr)).map((m: any) => ({
          id: m.user_id,
          name: m.name || 'Unknown',
          avatar: m.avatar || '/placeholder.svg',
          distanceContribution: Number(m.distance_km ?? 0),
        }));
      };

      matches.push({
        id: r.match_id,
        homeClub: {
          id: r.home_club_id,
          name: r.home_club_name,
          logo: r.home_club_logo || '/placeholder.svg',
          totalDistance: Number(r.home_total_distance ?? 0),
          members: parseMembers(r.home_club_members),
        },
        awayClub: {
          id: r.away_club_id,
          name: r.away_club_name,
          logo: r.away_club_logo || '/placeholder.svg',
          totalDistance: Number(r.away_total_distance ?? 0),
          members: parseMembers(r.away_club_members),
        },
        startDate: r.start_date,
        endDate: r.end_date,
        status: r.status,
        winner: r.winner,
        leagueBeforeMatch: r.league_before_match,
        leagueAfterMatch: r.league_after_match,
      } as Match);
    }

    return matches;
  };

  return { fetchClubMatches };
};
