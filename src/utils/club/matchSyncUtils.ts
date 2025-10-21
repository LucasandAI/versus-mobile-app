
import { Club } from '@/types';
import { calculateNewDivisionAndTier, ensureDivision } from './leagueUtils';

export const syncClubDivisionWithMatchHistory = (club: Club): Club => {
  if (!club.matchHistory || club.matchHistory.length === 0) {
    return club;
  }

  // Log match history for debugging
  console.log("Syncing club division. Match history count:", club.matchHistory.length);
  
  // Sort matches by date (newest first)
  const sortedHistory = [...club.matchHistory].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  const latestMatch = sortedHistory[0];
  console.log("Latest match:", latestMatch);
  
  // If the latest match has league data, use it to update the club's division/tier
  if (latestMatch.leagueAfterMatch) {
    console.log("Using leagueAfterMatch from latest match:", latestMatch.leagueAfterMatch);
    
    // Find the correct side (home or away) for this club
    const isHome = latestMatch.homeClub.id === club.id;
    const sideKey = isHome ? 'home' : 'away';
    const leagueAfter = latestMatch.leagueAfterMatch[sideKey];
    
    if (leagueAfter) {
      // Ensure division is valid
      const division = ensureDivision(leagueAfter.division);
      
      return {
        ...club,
        division,
        tier: leagueAfter.tier || 1,
        // Include elite points if available
        elitePoints: leagueAfter.elitePoints !== undefined ? 
          leagueAfter.elitePoints : 
          (division === 'elite' ? club.elitePoints : 0)
      };
    }
  }

  // Fallback to calculating if leagueAfterMatch is missing
  console.log("No leagueAfterMatch data found, calculating...");
  
  const isHomeTeam = latestMatch.homeClub.id === club.id;
  const weWon = (isHomeTeam && latestMatch.winner === 'home') || (!isHomeTeam && latestMatch.winner === 'away');
  
  const newDivisionAndTier = calculateNewDivisionAndTier(
    club.division, 
    club.tier || 1, 
    weWon,
    club.elitePoints || 0
  );
  
  console.log("Calculated new division and tier:", newDivisionAndTier);
  
  return {
    ...club,
    division: newDivisionAndTier.division,
    tier: newDivisionAndTier.tier,
    elitePoints: newDivisionAndTier.elitePoints !== undefined ? 
      newDivisionAndTier.elitePoints : 
      (club.division === 'elite' ? club.elitePoints : 0)
  };
};
