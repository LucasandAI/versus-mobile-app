
import { Club, Division } from '@/types';

export const getBestLeague = (clubs: Club[] = []) => {
  if (!clubs || clubs.length === 0) {
    return { league: 'bronze' as Division, tier: 5 };
  }

  const leagueRanking = {
    'elite': 0,
    'diamond': 1,
    'platinum': 2,
    'gold': 3,
    'silver': 4,
    'bronze': 5
  };

  return clubs.reduce((best, club) => {
    const clubRank = leagueRanking[club.division];
    const clubTier = club.tier || 5;
    
    if (clubRank < best.rank || (clubRank === best.rank && clubTier < best.tier)) {
      return { 
        league: club.division, 
        tier: clubTier,
        rank: clubRank
      };
    }
    return best;
  }, { league: 'bronze' as Division, tier: 5, rank: 5 });
};
