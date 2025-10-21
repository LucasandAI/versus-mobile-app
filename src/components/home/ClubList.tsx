
import React from 'react';
import { Club } from '@/types';
import ClubCard from '../club/ClubCard';
import Button from '../shared/Button';
import { Skeleton } from '@/components/ui/skeleton';

interface ClubListProps {
  userClubs: Club[];
  loading?: boolean;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
  onCreateClub: () => void;
}

const ClubList: React.FC<ClubListProps> = ({
  userClubs,
  loading = false,
  onSelectUser,
  onCreateClub,
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }
  
  // Ensure clubs are fully loaded with all required data
  const validClubs = userClubs.filter(club => 
    club && club.name && club.members && Array.isArray(club.members)
  );
  
  if (validClubs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="font-medium mb-2">No clubs yet</h3>
        <p className="text-gray-500 text-sm mb-4">
          Create or join a club to start competing
        </p>
        <Button 
          variant="primary" 
          size="sm"
          onClick={onCreateClub}
        >
          Create Club
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {validClubs.map((club) => (
        <ClubCard
          key={club.id}
          club={club}
          onSelectUser={onSelectUser}
        />
      ))}
    </div>
  );
};

export default ClubList;
