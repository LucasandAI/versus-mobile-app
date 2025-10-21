
import React from 'react';
import { Match, Club } from '@/types';
import MatchDisplay from './MatchDisplay';

interface CurrentMatchCardProps {
  match: Match;
  userClub: Club;
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
  forceShowDetails?: boolean;
}

const CurrentMatchCard: React.FC<CurrentMatchCardProps> = ({
  match,
  userClub,
  onViewProfile,
  forceShowDetails = false
}) => {
  // Log the data being passed to help with debugging
  console.log('[CurrentMatchCard] Rendering with data:', {
    matchId: match?.id,
    userClubId: userClub?.id,
    forceShowDetails
  });
  
  // Pass all props including forceShowDetails to MatchDisplay
  return (
    <MatchDisplay
      match={match}
      userClub={userClub}
      onViewProfile={onViewProfile}
      forceShowDetails={forceShowDetails}
    />
  );
};

export default CurrentMatchCard;
