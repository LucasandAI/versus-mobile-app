
import { Club, ClubMember, Division, Match, LeagueStatus } from '@/types';
import { ensureDivision } from './leagueUtils';

// Transform raw match data from Supabase into our Match type
export const transformMatchData = (
  matchData: any,
  currentClubId: string,
  clubsMap: Map<string, {name: string, logo: string, members: ClubMember[]}>
): Match => {
  const isHomeTeam = matchData.home_club_id === currentClubId;
  const homeClubInfo = clubsMap.get(matchData.home_club_id) || { name: 'Unknown Club', logo: '/placeholder.svg', members: [] };
  const awayClubInfo = clubsMap.get(matchData.away_club_id) || { name: 'Unknown Club', logo: '/placeholder.svg', members: [] };
  
  // Parse league data with the new nested structure
  const parseLeagueData = (leagueData: any) => {
    if (!leagueData) return undefined;
    
    try {
      // If it's a string, try to parse it as JSON
      const parsedData = typeof leagueData === 'string' ? JSON.parse(leagueData) : leagueData;
      
      // Check if it's already in the correct format with home/away structure
      if (parsedData.home && parsedData.away) {
        return {
          home: {
            division: ensureDivision(parsedData.home.division || 'bronze'),
            tier: parseInt(parsedData.home.tier || '1', 10),
            elitePoints: parseInt(parsedData.home.elite_points || parsedData.home.elitePoints || '0', 10)
          },
          away: {
            division: ensureDivision(parsedData.away.division || 'bronze'),
            tier: parseInt(parsedData.away.tier || '1', 10),
            elitePoints: parseInt(parsedData.away.elite_points || parsedData.away.elitePoints || '0', 10)
          }
        };
      } 
      
      // Fallback to old format and convert to new format
      return {
        home: {
          division: ensureDivision(parsedData.division || 'bronze'),
          tier: parseInt(parsedData.tier || '1', 10),
          elitePoints: parseInt(parsedData.elite_points || parsedData.elitePoints || '0', 10)
        },
        away: {
          division: ensureDivision(parsedData.division || 'bronze'),
          tier: parseInt(parsedData.tier || '1', 10),
          elitePoints: parseInt(parsedData.elite_points || parsedData.elitePoints || '0', 10)
        }
      };
    } catch (e) {
      console.error('Error parsing league data:', e);
      return {
        home: {
          division: 'bronze' as Division,
          tier: 1,
          elitePoints: 0
        },
        away: {
          division: 'bronze' as Division,
          tier: 1,
          elitePoints: 0
        }
      };
    }
  };
  
  // Parse winner to ensure it matches the expected union type
  const parseWinner = (winnerValue: string | null): 'home' | 'away' | 'draw' | undefined => {
    if (!winnerValue) return undefined;
    
    if (winnerValue === 'home' || winnerValue === 'away' || winnerValue === 'draw') {
      return winnerValue;
    }
    
    // If it doesn't match, determine based on total distance
    const homeDistance = homeClubInfo.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
    const awayDistance = awayClubInfo.members.reduce((sum, m) => sum + (m.distanceContribution || 0), 0);
    
    if (homeDistance > awayDistance) return 'home';
    if (awayDistance > homeDistance) return 'away';
    return 'draw';
  };
  
  return {
    id: matchData.id,
    homeClub: {
      id: matchData.home_club_id,
      name: homeClubInfo.name,
      logo: homeClubInfo.logo,
      totalDistance: 0, // This would need to be calculated from distances
      members: homeClubInfo.members
    },
    awayClub: {
      id: matchData.away_club_id,
      name: awayClubInfo.name,
      logo: awayClubInfo.logo,
      totalDistance: 0, // This would need to be calculated from distances
      members: awayClubInfo.members
    },
    startDate: matchData.start_date,
    endDate: matchData.end_date,
    status: new Date(matchData.end_date) > new Date() ? 'active' : 'completed',
    winner: parseWinner(matchData.winner),
    leagueBeforeMatch: parseLeagueData(matchData.league_before_match),
    leagueAfterMatch: parseLeagueData(matchData.league_after_match)
  };
};

export const transformRawMatchesToMatchType = (matches: any[], clubId: string): Match[] => {
  if (!matches || matches.length === 0) return [];
  
  return matches.map(match => {
    // Create a simple clubs map for this match
    const clubsMap = new Map();
    clubsMap.set(match.home_club_id, { 
      name: 'Home Club', 
      logo: '/placeholder.svg',
      members: [] 
    });
    clubsMap.set(match.away_club_id, { 
      name: 'Away Club', 
      logo: '/placeholder.svg',
      members: [] 
    });
    
    return transformMatchData(match, clubId, clubsMap);
  });
};

// For generating mock match history
export const generateMatchHistoryFromDivision = (club: Club): Match[] => {
  // Generate a basic match history appropriate for the club's division
  const matchCount = 5;
  const result: Match[] = [];
  
  for (let i = 0; i < matchCount; i++) {
    const isWin = Math.random() > 0.4; // 60% win rate
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (i + 1) * 7);
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 5);
    
    const homeDistance = Math.round((50 + Math.random() * 50) * 10) / 10;
    const awayDistance = Math.round((isWin ? homeDistance * 0.9 : homeDistance * 1.1) * 10) / 10;
    
    // Generate league data in the correct format with ensureDivision for all division values
    const opponentDivision = 
                 club.division === 'diamond' ? 'platinum' : 
                 club.division === 'platinum' ? 'gold' : 
                 club.division === 'gold' ? 'silver' : 
                 club.division === 'silver' ? 'bronze' : 'bronze';
                 
    // Make sure we handle 'elite' division separately to prevent type errors
    const oppDiv = club.division === 'elite' ? 'diamond' as Division : opponentDivision as Division;
                 
    const leagueData = {
      home: {
        division: club.division,
        tier: club.tier,
        elitePoints: club.division === 'elite' ? club.elitePoints : undefined
      },
      away: {
        division: ensureDivision(oppDiv),
        tier: Math.floor(Math.random() * 5) + 1,
        elitePoints: oppDiv === 'elite' ? Math.floor(Math.random() * 5) : undefined
      }
    };
    
    const match: Match = {
      id: `mock-${i}-${club.id}`,
      homeClub: {
        id: club.id,
        name: club.name,
        logo: club.logo,
        totalDistance: homeDistance,
        members: club.members.map(member => ({
          ...member,
          distanceContribution: homeDistance / (club.members.length || 1)
        }))
      },
      awayClub: {
        id: `opponent-${i}`,
        name: `Opponent ${i+1}`,
        logo: '/placeholder.svg',
        totalDistance: awayDistance,
        members: []
      },
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: 'completed',
      winner: isWin ? 'home' : 'away',
      leagueBeforeMatch: leagueData,
      leagueAfterMatch: leagueData
    };
    
    result.push(match);
  }
  
  return result;
};
