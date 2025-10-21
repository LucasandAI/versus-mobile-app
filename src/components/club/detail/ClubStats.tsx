
import React from 'react';
import { Club, Match } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatLeague } from '@/utils/club/leagueUtils';
import { Flame } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ClubStatsProps {
  club: Club;
  matchHistory: Match[] | undefined;
}

const ClubStats: React.FC<ClubStatsProps> = ({ club, matchHistory }) => {
  // Safely handle potentially undefined club or matchHistory
  if (!club || typeof club !== 'object') {
    return <StatsLoadingSkeleton />;
  }
  
  // Safely handle potentially undefined matchHistory
  const safeMatchHistory = Array.isArray(matchHistory) ? matchHistory : [];
  
  // Filter out active matches - only include completed matches in stats
  const completedMatches = safeMatchHistory.filter(match => match && match.status === 'completed');
  
  // Calculate win/loss/tie record from match history - only considering completed matches
  const wins = completedMatches.filter(match => {
    if (!match || !match.homeClub?.id || !match.winner) return false;
    const isHomeTeam = match.homeClub.id === club.id;
    return (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
  }).length;
  
  const ties = completedMatches.filter(match => {
    return match && match.winner === 'draw';
  }).length;
  
  const losses = completedMatches.length - wins - ties;
  
  // Calculate win streak - only considering completed matches
  const winStreak = calculateWinStreak(completedMatches, club.id);
  
  // Calculate total and average distance
  const totalDistance = completedMatches.reduce((sum, match) => {
    if (!match?.homeClub?.id) return sum;
    const isHomeTeam = match.homeClub.id === club.id;
    const clubInMatch = isHomeTeam ? match.homeClub : match.awayClub;
    return sum + (typeof clubInMatch?.totalDistance === 'number' ? clubInMatch.totalDistance : 0);
  }, 0);
  
  // Safely handle potentially undefined club.members
  const memberCount = Array.isArray(club.members) ? club.members.length : 0;
  const avgPerMember = memberCount > 0 ? (totalDistance / memberCount) : 0;
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          Club Details
          {winStreak > 1 && (
            <div className="flex items-center gap-1 text-sm font-normal bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
              <Flame className="h-3.5 w-3.5 text-amber-600" />
              <span>{winStreak} streak</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">League</p>
            <p className="font-medium">{formatLeague(club.division, club.tier)}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Match Record</p>
            <p className="font-medium">
              {completedMatches.length > 0 
                ? `${wins}W - ${losses}L${ties > 0 ? ` - ${ties}T` : ''}` 
                : 'No matches yet'}
            </p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Total Distance</p>
            <p className="font-medium">{totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : '0 km'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-xs text-gray-500">Avg. Per Member</p>
            <p className="font-medium">{avgPerMember > 0 ? `${avgPerMember.toFixed(1)} km` : '0 km'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Loading skeleton for stats when data is not yet available
const StatsLoadingSkeleton = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-md">
              <Skeleton className="h-4 w-16 mb-1" />
              <Skeleton className="h-6 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate win streak with null safety - only considering completed matches
const calculateWinStreak = (matches: Match[] | undefined, clubId: string): number => {
  if (!Array.isArray(matches) || !matches.length || !clubId) return 0;
  
  // Sort by most recent first and filter for only completed matches
  const sortedMatches = [...matches]
    .filter(match => match && match.status === 'completed')
    .sort((a, b) => {
      if (!a || !a.endDate || !b || !b.endDate) return 0;
      return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
    });
  
  let streak = 0;
  
  for (const match of sortedMatches) {
    if (!match || !match.homeClub?.id || !match.winner) continue;
    
    // Ties break the streak
    if (match.winner === 'draw') break;
    
    const isHomeTeam = match.homeClub.id === clubId;
    const isWin = (isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away');
    
    if (isWin) {
      streak++;
    } else {
      break; // Stop counting on first loss
    }
  }
  
  return streak;
};

export default ClubStats;
