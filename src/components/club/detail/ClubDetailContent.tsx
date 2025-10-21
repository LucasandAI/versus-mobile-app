
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { useClubJoin } from '@/hooks/home/useClubJoin';
import ClubHeader from './ClubHeader';
import ClubDetailTabs from './ClubDetailTabs';
import ClubLeaveDialog from './dialogs/ClubLeaveDialog';
import InviteUserDialog from '../InviteUserDialog';
import { useClubMembership } from '@/hooks/club/useClubMembership';
import { useClubActions } from '@/hooks/club/useClubActions';
import { Skeleton } from "@/components/ui/skeleton";

interface ClubDetailContentProps {
  club: Club;
}

const ClubDetailContent: React.FC<ClubDetailContentProps> = ({ club }) => {
  const { currentUser, setCurrentView } = useApp();
  const { handleRequestToJoin } = useClubJoin();
  
  // Handle null club case
  if (!club || !club.id) {
    return <LoadingSkeleton />;
  }
  
  const {
    isActuallyMember,
    isAdmin,
    hasPending,
    showInviteDialog,
    setShowInviteDialog,
    showLeaveDialog,
    setShowLeaveDialog,
    setHasPending
  } = useClubMembership(club);

  const {
    handleLeaveClub,
    handleJoinFromInvite,
    handleDeclineInvite
  } = useClubActions(club);

  const handleRequestToJoinClub = () => {
    if (club && club.id) {
      handleRequestToJoin(club.id, club.name || 'Club');
    }
  };

  return (
    <div className="pb-20 relative">
      <ClubHeader 
        club={club}
        isActuallyMember={isActuallyMember}
        isAdmin={isAdmin}
        onBack={() => setCurrentView('home')}
        onInvite={() => setShowInviteDialog(true)}
        onRequestJoin={handleRequestToJoinClub}
        onLeaveClub={() => setShowLeaveDialog(true)}
        onJoinClub={handleJoinFromInvite}
        onDeclineInvite={handleDeclineInvite}
        hasPendingInvite={hasPending}
      />

      <div className="container-mobile pt-4">
        <ClubDetailTabs 
          club={club}
          isActuallyMember={isActuallyMember}
          currentUser={currentUser}
        />
      </div>

      <ClubLeaveDialog
        open={showLeaveDialog}
        onOpenChange={setShowLeaveDialog}
        clubName={club.name || 'Club'}
        onConfirm={handleLeaveClub}
        isAdmin={isAdmin}
        members={Array.isArray(club.members) ? club.members : []}
        currentUserId={currentUser?.id || ''}
      />

      {club && (
        <InviteUserDialog
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
          clubId={club.id}
          clubName={club.name}
        />
      )}
    </div>
  );
};

// Loading skeleton for the entire club detail content
const LoadingSkeleton = () => {
  return (
    <div className="pb-20 relative">
      <div className="bg-white shadow-md">
        <div className="container-mobile py-6">
          <Skeleton className="h-24 w-24 rounded-full mb-4 mx-auto" />
          <Skeleton className="h-8 w-48 mb-2 mx-auto" />
          <Skeleton className="h-4 w-full mt-6" />
          <Skeleton className="h-4 w-4/5 mt-2" />
        </div>
      </div>
      
      <div className="container-mobile pt-4">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
};

export default ClubDetailContent;
