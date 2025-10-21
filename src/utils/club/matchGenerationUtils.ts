
import { Club, ClubMember, Division, Match } from '@/types';
import { ensureDivision } from './leagueUtils';

// Helper function to generate a random date within last 3 months
export const getRandomRecentDate = (maxDaysAgo: number = 90): Date => {
  const today = new Date();
  const daysAgo = Math.floor(Math.random() * maxDaysAgo);
  const result = new Date(today);
  result.setDate(today.getDate() - daysAgo);
  return result;
};

// Format date to ISO string for serialization
export const formatDateIso = (date: Date): string => {
  return date.toISOString();
};

// Helper function to create a match result based on a club's league
export const createMatchResultForLeague = (
  homeClub: Club,
  daysAgo: number = 7,
  isWin?: boolean
): Match => {
  // Generate opposing club based on league
  const awayClub = generateOpposingClub(homeClub);
  
  // Determine match dates
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - daysAgo);
  
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7); // Match duration is 7 days
  
  // Determine winner (if not specified)
  const determineWinner = isWin !== undefined ? isWin : Math.random() > 0.5;
  const winner = determineWinner ? 'home' : 'away';
  
  // Generate league status before and after the match with the new nested structure
  const leagueBeforeMatch = {
    home: {
      division: homeClub.division,
      tier: homeClub.tier,
      elitePoints: homeClub.elitePoints
    },
    away: {
      division: awayClub.division,
      tier: awayClub.tier,
      elitePoints: awayClub.elitePoints
    }
  };
  
  // Calculate new league status after match
  let leagueAfterMatch = {
    home: { ...leagueBeforeMatch.home },
    away: { ...leagueBeforeMatch.away }
  };
  
  const divisionValue = ensureDivision(homeClub.division);
  
  // Elite league special handling
  if (divisionValue === 'elite') {
    if (winner === 'home') {
      leagueAfterMatch.home.elitePoints = (leagueBeforeMatch.home.elitePoints || 0) + 1;
    } else {
      leagueAfterMatch.home.elitePoints = Math.max((leagueBeforeMatch.home.elitePoints || 0) - 1, 0);
    }
  } 
  // Other leagues: promotion/relegation based on tiers
  else {
    if (winner === 'home') {
      // Promotion logic
      if (leagueBeforeMatch.home.tier === 1) {
        // Promote to next division
        if (divisionValue === 'bronze') {
          leagueAfterMatch.home.division = 'silver';
          leagueAfterMatch.home.tier = 5;
        } else if (divisionValue === 'silver') {
          leagueAfterMatch.home.division = 'gold';
          leagueAfterMatch.home.tier = 5;
        } else if (divisionValue === 'gold') {
          leagueAfterMatch.home.division = 'elite';
          leagueAfterMatch.home.tier = 1;
          leagueAfterMatch.home.elitePoints = 0;
        }
      } else {
        // Move up within same division
        leagueAfterMatch.home.tier = Math.max(leagueBeforeMatch.home.tier - 1, 1);
      }
    } else {
      // Relegation logic
      if (leagueBeforeMatch.home.tier === 5) {
        // Relegate to previous division
        if (divisionValue === 'gold') {
          leagueAfterMatch.home.division = 'silver';
          leagueAfterMatch.home.tier = 1;
        } else if (divisionValue === 'silver') {
          leagueAfterMatch.home.division = 'bronze';
          leagueAfterMatch.home.tier = 1;
        }
        // Bronze stays at bronze 5
      } else {
        // Move down within same division
        leagueAfterMatch.home.tier = Math.min(leagueBeforeMatch.home.tier + 1, 5);
      }
    }
  }
  
  // Create the match result
  return {
    id: `match-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    status: 'completed',
    startDate: formatDateIso(startDate),
    endDate: formatDateIso(endDate),
    homeClub: {
      id: homeClub.id,
      name: homeClub.name,
      logo: homeClub.logo,
      totalDistance: winner === 'home' ? 150 : 100,
      members: homeClub.members.map(member => ({
        ...member,
        distanceContribution: (winner === 'home' ? 150 : 100) / Math.max(homeClub.members.length, 1)
      }))
    },
    awayClub: {
      id: awayClub.id,
      name: awayClub.name,
      logo: awayClub.logo,
      totalDistance: winner === 'away' ? 150 : 100,
      members: awayClub.members.map(member => ({
        ...member,
        distanceContribution: (winner === 'away' ? 150 : 100) / Math.max(awayClub.members.length, 1)
      }))
    },
    winner,
    leagueBeforeMatch,
    leagueAfterMatch
  };
};

// Generate an opposing club based on the home club's league
export const generateOpposingClub = (homeClub: Club): Club => {
  const divisionValue = ensureDivision(homeClub.division);
  
  // Get a league-appropriate name
  const names = {
    bronze: ['Bronze Stars', 'Rookie Runners', 'Beginner Biathletes', 'Newbie Navigators'],
    silver: ['Silver Sprinters', 'Midway Marathoners', 'Core Cyclists', 'Steady Striders'],
    gold: ['Golden Gazelles', 'Premier Pacers', 'Elite Endurance', 'Top Triathletes'],
    elite: ['Champion Chargers', 'Ultimate Ultrarunners', 'Supreme Speedsters', 'Master Movers']
  };
  
  const divisionNames = names[divisionValue] || names.bronze;
  const randomName = divisionNames[Math.floor(Math.random() * divisionNames.length)];
  
  // Generate random members (1-5)
  const memberCount = Math.floor(Math.random() * 5) + 1;
  const members: ClubMember[] = [];
  
  for (let i = 0; i < memberCount; i++) {
    members.push({
      id: `opp-member-${i}-${Date.now()}`,
      name: `Runner ${i+1}`,
      avatar: '/placeholder.svg',
      isAdmin: i === 0, // First member is admin
      distanceContribution: 0 // Will be set later
    });
  }
  
  return {
    id: `opp-club-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: randomName,
    logo: '/placeholder.svg',
    division: divisionValue,
    tier: homeClub.tier || 3,
    members,
    elitePoints: divisionValue === 'elite' ? Math.floor(Math.random() * 10) : 0,
    matchHistory: []
  };
};
