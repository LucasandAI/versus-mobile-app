
import { Club, ClubMember, Division } from '@/types';
import { availableClubs } from '@/data/availableClubs';

export const MAX_CLUBS_PER_USER = 3;

export const findClubById = (clubId: string, allClubs: Club[]): Club | undefined => {
  return allClubs.find(club => club.id === clubId);
};

export const createNewClub = (clubId: string, clubName: string): Club => {
  return {
    id: clubId,
    name: clubName,
    logo: '/placeholder.svg',
    division: 'bronze' as Division,
    tier: 3,
    elitePoints: 0,
    members: [],
    currentMatch: null,
    matchHistory: [],
    isPreviewClub: true
  };
};

export const isUserClubMember = (club: Club, userId: string): boolean => {
  return club.members.some(member => member.id === userId);
};

// This function generates a random logo based on the club name
export const getRandomLogoForName = (name: string): string => {
  // Generate a deterministic but seemingly random logo based on the club name
  const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Available logo options (using placeholder for now)
  const logoOptions = [
    '/placeholder.svg',
    '/placeholder.svg', // In a real app, we would have multiple logo options
  ];
  
  // Use the seed to select a logo
  const index = seed % logoOptions.length;
  return logoOptions[index];
};

export const getClubToJoin = (clubId: string, clubName: string, allClubs: Club[]): Club => {
  // Try to find the club in the available clubs (mock data)
  const mockClub = availableClubs.find(club => club.id === clubId);
  
  // Try to find the club in the user's clubs
  let clubToJoin = findClubById(clubId, allClubs);

  // If club wasn't found, create it based on mock or as a new club
  if (!clubToJoin) {
    if (mockClub) {
      // Create from mock data
      clubToJoin = { 
        ...createNewClub(mockClub.id, mockClub.name),
        division: mockClub.division as Division, 
        tier: mockClub.tier,
        logo: mockClub.logo || '/placeholder.svg',
        isPreviewClub: true
      };
    } else {
      // Create a completely new club
      clubToJoin = createNewClub(clubId, clubName);
    }
  }

  return clubToJoin;
};
