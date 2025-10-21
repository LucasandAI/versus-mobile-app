
import { Division } from '@/types';

export const formatLeagueWithTier = (division?: Division, tier?: number) => {
  if (!division) return 'Unknown League';
  
  // Handle the elite division case specifically
  if (division.toLowerCase() === 'elite') return 'Elite League';
  
  // Safely capitalize the first letter if the division name exists
  const capitalizedDivision = division.charAt(0).toUpperCase() + division.slice(1);
  
  // Return with tier if available, otherwise just the division name
  return tier ? `${capitalizedDivision} ${tier}` : capitalizedDivision;
};

// Format club capacity as a string like "3/5 Members"
export const formatClubCapacity = (memberCount: number): string => {
  const maxMembers = 5;
  return `${memberCount}/${maxMembers} Members`;
};

// Check if a club is at capacity
export const isClubAtCapacity = (memberCount: number): boolean => {
  return memberCount >= 5;
};
