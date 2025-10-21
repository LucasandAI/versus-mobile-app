
import React, { useState, useEffect } from 'react';
import { Club, Match } from '@/types';
import CurrentMatchCard from './CurrentMatchCard';
import WaitingForMatchCard from './WaitingForMatchCard';
import NeedMoreMembersCard from './NeedMoreMembersCard';
import { useMatchInfo } from '@/hooks/match/useMatchInfo';
import { Skeleton } from "@/components/ui/skeleton";

interface CurrentMatchesListProps {
  userClubs: Club[];
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
}

const CurrentMatchesList: React.FC<CurrentMatchesListProps> = ({
  userClubs,
  onViewProfile
}) => {
  const { matches, isLoading } = useMatchInfo(userClubs);
  const [renderState, setRenderState] = useState<'loading' | 'partial' | 'complete'>('loading');
  
  // Progressive loading state management - no artificial delays
  useEffect(() => {
    if (isLoading) {
      // Stay in loading state
      setRenderState('loading');
    } else {
      // Immediately show content when data is ready
      setRenderState('complete');
    }
  }, [isLoading, matches.length]);

  if (!userClubs || userClubs.length === 0) {
    return (
      <div className="text-center p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500">You haven't joined any clubs yet.</p>
      </div>
    );
  }

  return (
    <div>
      {renderState === 'loading' ? (
        <div className="space-y-3">
          {userClubs.map((club, i) => (
            <Skeleton key={`skeleton-${club.id || i}`} className="h-40 bg-gray-100 animate-pulse rounded-md" />
          ))}
        </div>
      ) : (
        userClubs.map(club => {
          if (!club) return null;
          
          // Find the active match for this club
          const activeMatch = matches.find(match => 
            (match.homeClub.id === club.id || match.awayClub.id === club.id) && 
            match.status === 'active'
          );
          
          const hasEnoughMembers = club.members && club.members.length >= 5;
          
          if (activeMatch) {
            return (
              <div key={`${club.id}-match`} className="mb-6">
                <CurrentMatchCard
                  match={activeMatch}
                  userClub={club}
                  onViewProfile={onViewProfile}
                />
              </div>
            );
          } else if (hasEnoughMembers) {
            return <WaitingForMatchCard key={`${club.id}-waiting`} club={club} />;
          } else {
            return <NeedMoreMembersCard key={`${club.id}-needs-members`} club={club} />;
          }
        })
      )}
    </div>
  );
};

export default CurrentMatchesList;
