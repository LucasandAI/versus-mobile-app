
import React from 'react';
import { Club } from '@/types';
import AppHeader from '@/components/shared/AppHeader';
import { Skeleton } from "@/components/ui/skeleton";
import ClubHeaderInfo from './header/ClubHeaderInfo';
import ClubHeaderActions from './header/ClubHeaderActions';

interface ClubHeaderProps {
  club: Club;
  isActuallyMember: boolean;
  isAdmin: boolean;
  onBack: () => void;
  onInvite: () => void;
  onRequestJoin: () => void;
  onLeaveClub: () => void;
  onJoinClub: () => void;
  onDeclineInvite: () => void;
  hasPendingInvite: boolean;
}

const ClubHeader: React.FC<ClubHeaderProps> = ({
  club,
  isActuallyMember,
  isAdmin,
  onBack,
  onInvite,
  onRequestJoin,
  onLeaveClub,
  onJoinClub,
  onDeclineInvite,
  hasPendingInvite,
}) => {
  // Handle null club case
  if (!club || typeof club !== 'object') {
    return <ClubHeaderLoadingSkeleton onBack={onBack} />;
  }
  
  const memberCount = Array.isArray(club.members) ? club.members.length : 0;
  const clubBio = club.bio || `Welcome to this running club! We're a group of passionate runners looking to challenge ourselves and improve together.`;

  return (
    <>
      <AppHeader 
        title={club.name || 'Loading club...'}
        onBack={onBack}
      />

      <div className="bg-white shadow-md">
        <div className="container-mobile py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <ClubHeaderInfo club={club} memberCount={memberCount} isAdmin={isAdmin} />
            
            <div className="flex flex-col items-center md:items-end">
              <ClubHeaderActions 
                isActuallyMember={isActuallyMember}
                isAdmin={isAdmin}
                memberCount={memberCount}
                hasPendingInvite={hasPendingInvite}
                onInvite={onInvite}
                onLeaveClub={onLeaveClub}
                onJoinClub={onJoinClub}
                onDeclineInvite={onDeclineInvite}
                onRequestJoin={onRequestJoin}
                clubId={club.id}
              />
            </div>
          </div>
          
          <div className="mt-4 border-t pt-4 text-center md:text-left">
            <p className="text-gray-600 text-sm">{clubBio}</p>
          </div>
        </div>
      </div>
    </>
  );
};

// Loading skeleton component stays in the same file since it's only used here
const ClubHeaderLoadingSkeleton: React.FC<{onBack: () => void}> = ({ onBack }) => {
  return (
    <>
      <AppHeader 
        title="Loading club..."
        onBack={onBack}
      />
      
      <div className="bg-white shadow-md">
        <div className="container-mobile py-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col items-center md:items-start mb-4 md:mb-0">
              <div className="mb-4">
                <Skeleton className="h-24 w-24 rounded-full" />
              </div>
              <Skeleton className="h-8 w-48 mb-2" />
              <div className="flex items-center mt-2 space-x-2">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-6 w-24" />
              </div>
            </div>
          </div>
          <div className="mt-4 border-t pt-4">
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </>
  );
};

export default ClubHeader;
