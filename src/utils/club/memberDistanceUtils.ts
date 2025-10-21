
import { Club, ClubMember } from '@/types';

// Calculates total distance for a club based on member contributions
export const calculateTotalClubDistance = (club: Club): number => {
  if (!club.members || club.members.length === 0) {
    return 0;
  }
  
  return club.members.reduce((total, member) => {
    // Ensure each member has a distanceContribution value
    const contribution = member.distanceContribution || 0;
    return total + contribution;
  }, 0);
};

// Adds a random distance contribution to each club member
export const addRandomDistanceToMembers = (club: Club): Club => {
  if (!club.members || club.members.length === 0) {
    return club;
  }
  
  const updatedMembers = club.members.map(member => {
    // Generate a random distance between 5-20km
    const randomDistance = 5 + Math.random() * 15;
    
    return {
      ...member,
      distanceContribution: (member.distanceContribution || 0) + randomDistance
    };
  });
  
  return {
    ...club,
    members: updatedMembers
  };
};

// Ensures each member has a distanceContribution property
export const ensureMemberDistances = (members: any[]): ClubMember[] => {
  return members.map(member => ({
    id: member.id,
    name: member.name,
    avatar: member.avatar || '/placeholder.svg',
    isAdmin: member.isAdmin || false,
    distanceContribution: member.distanceContribution || 0
  }));
};
