
import React from 'react';
import { Club, User } from '@/types';
import ClubStats from '../ClubStats';
import ClubCurrentMatch from '../ClubCurrentMatch';
import ClubAdminActions from '@/components/admin/ClubAdminActions';
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewTabProps {
  club: Club;
  currentUser: User | null;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ 
  club, 
  currentUser,
  onSelectUser 
}) => {
  // Handle null club case
  if (!club || typeof club !== 'object') {
    return <OverviewLoadingSkeleton />;
  }

  // Add optional chaining and fallback for the members array
  const isAdmin = currentUser && 
    Array.isArray(club.members) && 
    club.members.some(member => 
      member && member.id === currentUser.id && member.isAdmin === true
    ) || false;

  // Ensure matchHistory is an array
  const matchHistory = Array.isArray(club.matchHistory) ? club.matchHistory : [];

  return (
    <div className="space-y-6">
      <ClubStats club={club} matchHistory={matchHistory} />
      
      <div>
        {/* Directly pass clubId to fetch fresh data */}
        <ClubCurrentMatch
          clubId={club.id}
          onViewProfile={onSelectUser}
          forceShowDetails={true}
        />
      </div>
      
      {isAdmin && currentUser && <ClubAdminActions club={club} currentUser={currentUser} />}
    </div>
  );
};

// Loading skeleton for overview when data is not yet available
const OverviewLoadingSkeleton = () => {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
};

export default OverviewTab;
