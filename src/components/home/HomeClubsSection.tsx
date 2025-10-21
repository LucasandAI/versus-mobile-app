
import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import FindClubsSection from './FindClubsSection';
import { useApp } from '@/context/AppContext';
import CurrentMatchesList from '../match/CurrentMatchesList';

interface HomeClubsSectionProps {
  userClubs: Club[];
  availableClubs: any[];
  clubsLoading?: boolean;
  onSelectClub: (club: Club) => void;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
  onCreateClub: () => void;
  onRequestJoin: (clubId: string, clubName: string) => void;
  onSearchClick: () => void;
}

const HomeClubsSection: React.FC<HomeClubsSectionProps> = ({
  userClubs,
  availableClubs,
  clubsLoading = false,
  onSelectClub,
  onSelectUser,
  onCreateClub,
  onRequestJoin,
  onSearchClick
}) => {
  const { currentUser } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  
  // Optimized loading state management - removed artificial delay
  useEffect(() => {
    // If we have user and clubs data, we can start rendering
    if (currentUser && userClubs.length > 0 && !clubsLoading) {
      // No more artificial delay - set loading to false immediately
      setIsLoading(false);
    } else if (currentUser && !clubsLoading) {
      // User with no clubs - show empty state immediately
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [currentUser, userClubs, clubsLoading]);

  // Process clubs to ensure they have the necessary properties
  const processedUserClubs = userClubs
    .filter(club => club && club.name) // Only include clubs with name
    .map(club => ({
      ...club,
      // Ensure the members array exists
      members: club.members || []
    }));

  const isAtClubCapacity = processedUserClubs.length >= 3;

  return (
    <>
      <h2 className="text-xl font-bold mt-6 mb-4">Current Matches</h2>
      
      <CurrentMatchesList 
        userClubs={processedUserClubs}
        onViewProfile={onSelectUser}
      />

      {!isAtClubCapacity && !isLoading && (
        <FindClubsSection 
          clubs={availableClubs}
          isLoading={clubsLoading}
          onRequestJoin={onRequestJoin}
          onSearchClick={onSearchClick}
          onCreateClick={onCreateClub}
        />
      )}

      {isAtClubCapacity && !isLoading && (
        <div className="mt-10 bg-white rounded-lg shadow-md p-6 text-center">
          <h3 className="font-medium mb-2">Club Limit Reached</h3>
          <p className="text-gray-500 text-sm mb-4">
            You have reached the maximum of 3 clubs.
          </p>
        </div>
      )}
    </>
  );
};

export default HomeClubsSection;
