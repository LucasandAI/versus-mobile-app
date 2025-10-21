
import { Club, Match, MatchTeam, ClubMember } from '@/types';
import { ensureDivision } from '../club/leagueUtils';

// Cache to store processed match data
const matchDataCache: Record<string, {
  data: Match,
  timestamp: number
}> = {};

// Cache TTL in milliseconds (10 seconds)
const CACHE_TTL = 10000;

// Parse members data consistently across components
export const parseMembers = (membersJson: any): ClubMember[] => {
  if (!membersJson) return [];
  
  try {
    // Handle both string and object formats
    const parsedMembers = typeof membersJson === 'string' 
      ? JSON.parse(membersJson) 
      : membersJson;
      
    // Handle both array and object formats
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

// Calculate total distance for a team
export const calculateTotalDistance = (members: ClubMember[]): number => {
  return members.reduce((sum, member) => sum + (member.distanceContribution || 0), 0);
};

// Get winner value of the allowed literal types
export const getWinnerValue = (winnerStr: string | null): 'home' | 'away' | 'draw' | undefined => {
  if (winnerStr === 'home' || winnerStr === 'away' || winnerStr === 'draw') {
    return winnerStr;
  }
  return undefined;
};

// Transform raw match data to Match type with caching
export const transformMatchData = (rawMatch: any, userClubId: string): Match => {
  // Generate cache key based on match id and last updated timestamp
  const cacheKey = `${rawMatch.match_id}_${rawMatch.updated_at || ''}_${userClubId}`;
  
  // Check if we have a valid cached version
  const cachedMatch = matchDataCache[cacheKey];
  const now = Date.now();
  
  if (cachedMatch && (now - cachedMatch.timestamp < CACHE_TTL)) {
    return cachedMatch.data;
  }
  
  // Process members data
  const homeMembers = parseMembers(rawMatch.home_club_members);
  const awayMembers = parseMembers(rawMatch.away_club_members);
  
  // Calculate total distances
  const homeTotalDistance = rawMatch.home_total_distance !== null ? 
    parseFloat(String(rawMatch.home_total_distance)) : 
    calculateTotalDistance(homeMembers);
    
  const awayTotalDistance = rawMatch.away_total_distance !== null ? 
    parseFloat(String(rawMatch.away_total_distance)) : 
    calculateTotalDistance(awayMembers);

  // Create team objects
  const homeTeam: MatchTeam = {
    id: rawMatch.home_club_id,
    name: rawMatch.home_club_name || "Unknown Club",
    logo: rawMatch.home_club_logo || '/placeholder.svg',
    division: ensureDivision(rawMatch.home_club_division),
    tier: Number(rawMatch.home_club_tier || 1),
    totalDistance: homeTotalDistance,
    members: homeMembers
  };
  
  const awayTeam: MatchTeam = {
    id: rawMatch.away_club_id,
    name: rawMatch.away_club_name || "Unknown Club", 
    logo: rawMatch.away_club_logo || '/placeholder.svg',
    division: ensureDivision(rawMatch.away_club_division),
    tier: Number(rawMatch.away_club_tier || 1),
    totalDistance: awayTotalDistance,
    members: awayMembers
  };
  
  // Create the match object
  const match: Match = {
    id: rawMatch.match_id,
    homeClub: homeTeam,
    awayClub: awayTeam,
    startDate: rawMatch.start_date,
    endDate: rawMatch.end_date,
    status: rawMatch.status as 'active' | 'completed',
    winner: getWinnerValue(rawMatch.winner)
  };
  
  // Cache the result
  matchDataCache[cacheKey] = {
    data: match,
    timestamp: now
  };
  
  return match;
};

// Extract club IDs from club objects for efficient dependency tracking
export const getClubIdsString = (clubs: Club[]): string => {
  if (!clubs || clubs.length === 0) return '';
  return clubs.map(club => club.id).sort().join(',');
};

// Clear cache when needed (e.g., on manual refresh)
export const clearMatchCache = () => {
  Object.keys(matchDataCache).forEach(key => {
    delete matchDataCache[key];
  });
};
