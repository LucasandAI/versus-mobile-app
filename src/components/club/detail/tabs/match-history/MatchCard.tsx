
import React, { useState, useEffect } from 'react';
import { Match, Division, ClubMember } from '@/types';
import { ChevronDown, ChevronUp } from "lucide-react";
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { formatLeague, getDivisionEmoji } from '@/utils/club/leagueUtils';
import MatchDetails from './MatchDetails';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface MatchCardProps {
  match: Match;
  clubId: string;
  expandedMatchId: string | null;
  onExpandToggle: (matchId: string) => void;
  onSelectUser?: (userId: string, name: string, avatar?: string) => void;
  onSelectClub?: (clubId: string, name: string) => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ 
  match, 
  clubId, 
  expandedMatchId, 
  onExpandToggle,
  onSelectUser,
  onSelectClub
}) => {
  const [homeTeamMembers, setHomeTeamMembers] = useState<ClubMember[]>([]);
  const [awayTeamMembers, setAwayTeamMembers] = useState<ClubMember[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const fetchClubMembers = async (clubId: string, isHomeTeam: boolean): Promise<ClubMember[]> => {
    try {
      // First, get the member IDs from club_members
      const { data: memberData, error: memberError } = await supabase
        .from('club_members')
        .select('user_id, is_admin')
        .eq('club_id', clubId);

      if (memberError) throw memberError;
      if (!memberData || memberData.length === 0) return [];

      // Get user details from the users table
      const userIds = memberData.map(m => m.user_id);
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, avatar')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Get the team data to find distance contributions
      const teamData = isHomeTeam ? match.homeClub : match.awayClub;
      const teamMembers = teamData.members || [];

      // Combine the data
      return memberData.map(member => {
        const user = usersData?.find(u => u.id === member.user_id);
        const memberContribution = teamMembers.find(m => m.id === member.user_id);
        const distanceContribution = memberContribution?.distanceContribution || 0;
        
        return {
          id: member.user_id,
          name: user?.name || `User ${member.user_id.substring(0, 6)}`,
          avatar: user?.avatar || '/placeholder.svg',
          isAdmin: member.is_admin || false,
          distanceContribution: distanceContribution
        };
      });
    } catch (error) {
      console.error('Error fetching club members:', error);
      return [];
    }
  };

  const handleExpandClick = async (matchId: string) => {
    const isExpanding = expandedMatchId !== matchId;
    
    if (isExpanding) {
      setIsLoadingMembers(true);
      try {
        const [homeMembers, awayMembers] = await Promise.all([
          fetchClubMembers(match.homeClub.id, true),
          fetchClubMembers(match.awayClub.id, false)
        ]);
        
        setHomeTeamMembers(homeMembers);
        setAwayTeamMembers(awayMembers);
      } catch (error) {
        console.error('Error loading match members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    }
    
    onExpandToggle(matchId);
  };
  // Skip active matches in the match history tab
  if (match.status === 'active') {
    return null;
  }
  
  const isHomeTeam = match.homeClub?.id === clubId;
  const ourTeam = isHomeTeam ? match.homeClub : match.awayClub;
  const opponentTeam = isHomeTeam ? match.awayClub : match.homeClub;
  const theirTeam = isHomeTeam ? match.awayClub : match.homeClub;
  
  // Handle TIE outcome
  const matchResult = match.winner === 'draw' ? 'TIE' : 
    ((isHomeTeam && match.winner === 'home') || (!isHomeTeam && match.winner === 'away')) ? 'WIN' : 'LOSS';

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // For short matches (same day), show specific times
    if (start.toDateString() === end.toDateString()) {
      return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'h:mm a')}`;
    }
    
    const startMonth = start.toLocaleDateString('en-US', { month: 'long' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'long' });
    
    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
    } else {
      return `${startMonth} ${start.getDate()}–${endMonth} ${end.getDate()}, ${end.getFullYear()}`;
    }
  };

  const getLeagueImpactText = (match: Match, clubId: string) => {
    if (!match.leagueAfterMatch || !match.leagueBeforeMatch) {
      return 'No league data';
    }
    
    const isHome = match.homeClub.id === clubId;
    const sideKey = isHome ? 'home' : 'away';
    
    // Access nested properties correctly
    const beforeLeague = match.leagueBeforeMatch[sideKey];
    const afterLeagueData = match.leagueAfterMatch[sideKey];
    
    if (!beforeLeague || !afterLeagueData) {
      return 'No league data available';
    }
    
    const beforeDivision = beforeLeague.division;
    const afterDivision = afterLeagueData.division;
    const afterTier = afterLeagueData.tier;
    
    const afterEmoji = getDivisionEmoji(afterDivision);
    const formattedLeague = formatLeague(afterDivision, afterTier);
    
    // Fix for the type error: Explicitly handle 'draw' case separately from the other cases
    if (match.winner === 'draw') {
      return `Maintained in ${afterEmoji} ${formattedLeague}`;
    }
    
    const isDivisionChange = beforeDivision !== afterDivision;
    const isTierChange = beforeLeague.tier !== afterLeagueData.tier;
    
    if (afterDivision === 'elite') {
      const beforePoints = beforeLeague.elitePoints || 0;
      const afterPoints = afterLeagueData.elitePoints || 0;
      const pointChange = afterPoints - beforePoints;
      const pointsText = `(${pointChange >= 0 ? '+' : ''}${pointChange} points, total: ${afterPoints})`;
      
      if (beforeDivision !== 'elite') {
        return `Promoted to ${afterEmoji} ${formattedLeague} ${pointsText}`;
      } else {
        // This is the fixed section - we already handled 'draw' above
        if (matchResult === 'WIN') {
          return `Gained points in ${afterEmoji} ${formattedLeague} ${pointsText}`;
        } else {
          return `Lost points in ${afterEmoji} ${formattedLeague} ${pointsText}`;
        }
      }
    }
    
    // Simplify impact text based on match outcome
    if (matchResult === 'WIN') {
      return `Promoted to ${afterEmoji} ${formattedLeague}`;
    } else if (matchResult === 'LOSS') {
      return `Relegated to ${afterEmoji} ${formattedLeague}`;
    } else { // TIE
      return `Maintained in ${afterEmoji} ${formattedLeague}`;
    }
  };

  const dateRange = formatDateRange(match.startDate, match.endDate);

  // Determine the appropriate class for the match result
  const getResultClass = () => {
    switch(matchResult) {
      case 'WIN':
        return 'bg-green-100 text-green-800';
      case 'LOSS':
        return 'bg-red-100 text-red-800';
      case 'TIE':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-2 pb-3 border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-600">{dateRange}</p>
          <div className="flex items-center gap-2 mt-1">
            <h3 
              className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={() => onSelectClub?.(ourTeam.id, ourTeam.name)}
            >
              {ourTeam.name}
            </h3>
            <span className="text-gray-500 text-xs">vs</span>
            <h3 
              className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={() => onSelectClub?.(theirTeam.id, theirTeam.name)}
            >
              {theirTeam.name}
            </h3>
          </div>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getResultClass()}`}>
          {matchResult}
        </span>
      </div>

      <MatchProgressBar 
        homeDistance={ourTeam.totalDistance} 
        awayDistance={theirTeam.totalDistance}
        className="h-3 text-xs"
      />

      <div>
        <p className="flex items-center gap-1 text-xs font-medium">
          League Impact: 
          <span className={matchResult === 'WIN' ? 'text-green-600' : 
                           matchResult === 'LOSS' ? 'text-red-600' : 'text-amber-600'}>
            {getLeagueImpactText(match, clubId)}
          </span>
        </p>
      </div>

      <button
        className="w-full px-4 py-1 text-xs border rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
        onClick={() => handleExpandClick(match.id)}
      >
        {expandedMatchId === match.id ? (
          <>
            <ChevronUp className="h-3 w-3" />
            Hide Match Details
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3" />
            View Match Details
          </>
        )}
      </button>

      {expandedMatchId === match.id && (
        <MatchDetails 
          homeTeam={{
            ...match.homeClub,
            members: homeTeamMembers
          }}
          awayTeam={{
            ...match.awayClub,
            members: awayTeamMembers
          }}
          onSelectUser={onSelectUser} 
        />
      )}
    </div>
  );
};

export default MatchCard;
