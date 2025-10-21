
import React, { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import AvailableClubs from '../club/AvailableClubs';
import Button from '../shared/Button';
import { Skeleton } from '../ui/skeleton';

interface FindClubsSectionProps {
  clubs: any[];
  isLoading?: boolean;
  onRequestJoin: (clubId: string, clubName: string) => void;
  onSearchClick: () => void;
  onCreateClick: () => void;
}

const FindClubsSection: React.FC<FindClubsSectionProps> = ({
  clubs,
  isLoading = false,
  onRequestJoin,
  onSearchClick,
  onCreateClick,
}) => {
  const [displayedClubs, setDisplayedClubs] = useState<any[]>([]);

  const getRandomClubs = (allClubs: any[], count: number = 3) => {
    if (allClubs.length <= count) return allClubs;
    
    const shuffled = [...allClubs].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const refreshRandomClubs = () => {
    setDisplayedClubs(getRandomClubs(clubs));
  };

  useEffect(() => {
    if (clubs.length > 0) {
      setDisplayedClubs(getRandomClubs(clubs));
    }
  }, [clubs]);

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Find Clubs</h2>
        <div className="flex items-center gap-4">
          <button 
            className="text-primary flex items-center gap-1"
            onClick={refreshRandomClubs}
            disabled={isLoading || clubs.length === 0}
          >
            <RefreshCw className="h-4 w-4" />
            <span className="text-sm">Refresh</span>
          </button>
          <button 
            className="text-primary flex items-center gap-1"
            onClick={onSearchClick}
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-md p-4">
          <Skeleton className="h-4 w-1/3 mb-6" />
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ) : (
        <AvailableClubs 
          clubs={displayedClubs}
          onRequestJoin={onRequestJoin}
        />
      )}

      <div className="mt-6 text-center">
        <Button 
          variant="primary" 
          size="md"
          onClick={onCreateClick}
        >
          Create Club
        </Button>
      </div>
    </div>
  );
};

export default FindClubsSection;
