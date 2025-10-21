
import React, { useState, useEffect } from 'react';
import { Club, Match } from '@/types';
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import MatchCard from './match-history/MatchCard';
import { useNavigation } from '@/hooks/useNavigation';
import { useClubMatches } from '@/hooks/club/useClubMatches';

interface MatchHistoryTabProps {
  club: Club;
}

const MatchHistoryTab: React.FC<MatchHistoryTabProps> = ({ club }) => {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [showAllMatches, setShowAllMatches] = useState(false);
  const [matchHistory, setMatchHistory] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { navigateToUserProfile, navigateToClubDetail } = useNavigation();
  const { fetchClubMatches } = useClubMatches();

  useEffect(() => {
    const loadMatchHistory = async () => {
      if (!club.id) return;
      
      setIsLoading(true);
      try {
        const matches = await fetchClubMatches(club.id);
        setMatchHistory(matches);
      } catch (error) {
        console.error('Error loading match history:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadMatchHistory();
  }, [club.id]);

  const handleViewMatchDetails = (matchId: string) => {
    setExpandedMatchId(expandedMatchId === matchId ? null : matchId);
  };

  const handleViewAllHistory = () => {
    setShowAllMatches(!showAllMatches);
  };

  const handleSelectUser = (userId: string, name: string, avatar?: string) => {
    navigateToUserProfile(userId, name, avatar);
  };

  const handleSelectClub = (clubId: string, name: string, logo?: string) => {
    console.log("Selecting club from match history:", clubId, name);
    navigateToClubDetail(clubId, { 
      id: clubId, 
      name,
      logo: logo || '/placeholder.svg'
    });
  };

  // Filter out current matches, only show completed ones
  const completedMatches = matchHistory
    ? matchHistory.filter(match => match.status === 'completed')
    : [];
    
  // Sort by date (newest first)
  const sortedMatches = [...completedMatches].sort((a, b) => 
    new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
  );

  const displayedMatches = showAllMatches 
    ? sortedMatches 
    : sortedMatches.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow p-3 sm:p-4">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="text-primary h-4 w-4" />
        <h2 className="text-lg font-semibold">Match History</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">Loading match history...</p>
        </div>
      ) : sortedMatches.length > 0 ? (
        <div className="space-y-4">
          {displayedMatches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              clubId={club.id}
              expandedMatchId={expandedMatchId}
              onExpandToggle={handleViewMatchDetails}
              onSelectUser={handleSelectUser}
              onSelectClub={handleSelectClub}
            />
          ))}

          {sortedMatches.length > 3 && (
            <button
              className="w-full text-primary hover:text-primary/80 text-xs py-1 flex items-center justify-center gap-1"
              onClick={handleViewAllHistory}
            >
              {showAllMatches ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show Less Match History
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  View All Match History ({sortedMatches.length - 3} more)
                </>
              )}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No match history yet.</p>
          <p className="text-xs text-gray-400">Completed matches will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default MatchHistoryTab;
