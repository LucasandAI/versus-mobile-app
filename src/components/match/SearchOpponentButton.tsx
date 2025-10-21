
import React from 'react';
import { Button } from '@/components/ui/button';
import { useMatchmaking } from '@/hooks/match/useMatchmaking';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { SearchIcon, InfoIcon } from 'lucide-react';

interface SearchOpponentButtonProps {
  club: Club;
}

const SearchOpponentButton: React.FC<SearchOpponentButtonProps> = ({ club }) => {
  const { currentUser } = useApp();
  const { isSearching, searchForOpponent, isClubAdmin } = useMatchmaking(currentUser);
  
  const handleSearchClick = async () => {
    await searchForOpponent(club.id, club.division, club.tier);
  };
  
  // Display different content based on admin status
  if (!isClubAdmin(club.id)) {
    return (
      <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-md text-sm text-gray-600">
        <InfoIcon className="w-4 h-4 text-gray-500" />
        <span>Only club admins can search for opponents</span>
      </div>
    );
  }
  
  return (
    <Button 
      onClick={handleSearchClick}
      disabled={isSearching}
      className="w-full flex justify-center items-center gap-2"
      size="sm"
    >
      <SearchIcon className="w-4 h-4" />
      {isSearching ? 'Searching...' : 'Search for Opponent'}
    </Button>
  );
};

export default SearchOpponentButton;
