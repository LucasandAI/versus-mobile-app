
import { getRandomLogoForName } from './clubManagement';
import { syncClubDivisionWithMatchHistory } from './matchSyncUtils';
import { generateMatchHistoryFromDivision } from './matchHistoryUtils';
import { Club } from '@/types';

// Get or create a club object for joining
export const getClubToJoin = (
  clubId: string, 
  clubName: string, 
  existingClubs: Club[] = []
): Club => {
  // Check if we already have this club in the user's clubs
  const existingClub = existingClubs.find(c => c.id === clubId);
  if (existingClub) {
    return existingClub;
  }
  
  // Create a new club object for joining
  const newClub: Club = {
    id: clubId,
    name: clubName,
    logo: getRandomLogoForName(clubName),
    division: 'bronze',
    tier: 5,
    elitePoints: 0,
    members: [],
    isPreviewClub: true
  };

  // Add match history based on the club's division
  newClub.matchHistory = generateMatchHistoryFromDivision(newClub);
  
  // Sync club division based on match history
  return syncClubDivisionWithMatchHistory(newClub);
};

export * from './clubManagement';
export * from './matchHistoryUtils';
export * from './memberDistanceUtils';
