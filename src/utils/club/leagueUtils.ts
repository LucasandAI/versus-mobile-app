
import { Division } from '@/types';

export const formatLeague = (division?: Division, tier?: number) => {
  if (!division) return 'Bronze 5';
  
  if (division === 'elite') {
    return 'Elite League';
  }
  
  // Ensure division name is properly capitalized
  const divisionName = division.charAt(0).toUpperCase() + division.slice(1).toLowerCase();
  
  // Ensure tier is a valid number between 1 and 5
  const safeTier = typeof tier === 'number' && tier >= 1 && tier <= 5 
    ? tier 
    : 5;
    
  return `${divisionName} ${safeTier}`;
};

export const getDivisionEmoji = (division?: Division) => {
  if (!division) return '🥉'; // Default to bronze emoji
  
  // Normalize division to lowercase for comparison
  const normalizedDivision = division.toLowerCase() as Division;
  
  switch (normalizedDivision) {
    case 'elite':
      return '👑';
    case 'diamond':
      return '🔷';
    case 'platinum':
      return '💎';
    case 'gold':
      return '🥇';
    case 'silver':
      return '🥈';
    case 'bronze':
      return '🥉';
    default:
      return '🥉'; // Default to bronze emoji
  }
};

/**
 * Calculate new division and tier based on win/loss
 * 
 * League Progression:
 * - Bronze 5 → 1 (Win = move up tier, Lose = stay)
 * - Silver 5 → 1 (Win = move up tier, Lose = move down tier)
 * - Gold 5 → 1 (Win = move up tier, Lose = move down tier)
 * - Platinum 5 → 1 (Win = move up tier, Lose = move down tier)
 * - Diamond 5 → 1 (Win = move up tier to Elite if Tier 1, otherwise move up tier, Lose = move down tier)
 * - Elite League (point-based: +1 for win, -1 for loss)
 *   - If points < 0, relegate to Diamond 1
 */
export const calculateNewDivisionAndTier = (
  currentDivision?: Division,
  currentTier?: number,
  isWin?: boolean,
  elitePoints: number = 0
): { division: Division; tier: number; elitePoints?: number } => {
  // Default values if inputs are undefined
  const division = (currentDivision?.toLowerCase() as Division) || 'bronze';
  const tier = typeof currentTier === 'number' && currentTier >= 1 && currentTier <= 5
    ? currentTier 
    : 5;
  
  // Default to false if isWin is undefined
  const win = isWin === true;
  
  // Handle Elite division separately (point-based)
  if (division === 'elite') {
    const newElitePoints = elitePoints + (win ? 1 : -1);
    
    // If elite points become negative, relegate to Diamond 1
    if (newElitePoints < 0) {
      return {
        division: 'diamond',
        tier: 1,
        elitePoints: 0
      };
    }
    
    return {
      division: 'elite',
      tier: 1,
      elitePoints: newElitePoints
    };
  }
  
  // For non-elite divisions, handle promotion/relegation based on division and tier
  const divisionOrder: Division[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite'];
  const divisionIndex = divisionOrder.indexOf(division);
  
  if (win) {
    // Win scenario: always move up, either tier or division
    if (tier > 1) {
      // Move up within same division
      return {
        division: division,
        tier: tier - 1 // Lower tier number = higher rank (tier 1 is top)
      };
    } else {
      // At tier 1, move to next division if not already at top
      if (divisionIndex < divisionOrder.length - 1) {
        const nextDivision = divisionOrder[divisionIndex + 1];
        
        // If moving up to Elite, start with 0 elite points
        if (nextDivision === 'elite') {
          return {
            division: nextDivision,
            tier: 1,
            elitePoints: 0
          };
        }
        
        // For other divisions, start at tier 5 (bottom)
        return {
          division: nextDivision,
          tier: 5
        };
      } else {
        // Already at top division/tier, stay
        return {
          division: division,
          tier: tier
        };
      }
    }
  } else {
    // Loss scenario
    if (division === 'bronze') {
      // Bronze: stay at same division/tier even on loss
      return {
        division: division,
        tier: tier
      };
    } else {
      // All other divisions: move down tier on loss
      if (tier < 5) {
        // Move down within same division
        return {
          division: division,
          tier: tier + 1 // Higher tier number = lower rank
        };
      } else {
        // At tier 5, move to previous division
        const prevDivision = divisionOrder[divisionIndex - 1];
        return {
          division: prevDivision,
          tier: 1 // Start at top tier of lower division
        };
      }
    }
  }
};

// Helper function to validate division value from database
export const ensureDivision = (value?: string): Division => {
  if (!value) return 'bronze';
  
  // Convert division to lowercase and check if it's a valid division type
  const normalized = value.toLowerCase();
  const validDivisions: Division[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'elite'];
  
  return validDivisions.includes(normalized as Division) 
    ? (normalized as Division) 
    : 'bronze'; // Default to bronze if invalid
};
