
import React from 'react';
import { Club, User } from '@/types';
import ClubMembersList from './ClubMembersList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MatchHistoryTab from './tabs/MatchHistoryTab';
import OverviewTab from './tabs/OverviewTab';
import { useNavigation } from '@/hooks/useNavigation';
import { Skeleton } from "@/components/ui/skeleton";

interface ClubDetailTabsProps {
  club: Club;
  isActuallyMember: boolean;
  currentUser: User | null;
}

const ClubDetailTabs: React.FC<ClubDetailTabsProps> = ({ 
  club, 
  isActuallyMember, 
  currentUser 
}) => {
  const { navigateToUserProfile } = useNavigation();

  // Handle null club case
  if (!club || typeof club !== 'object') {
    return <ClubTabsLoadingSkeleton />;
  }

  const handleSelectUser = (userId: string, userName: string, userAvatar?: string) => {
    if (!userId) return;
    navigateToUserProfile(userId, userName || 'User', userAvatar);
  };

  // Safe access to club properties
  const safeClub = {
    ...club,
    members: Array.isArray(club.members) ? club.members : [],
    matchHistory: Array.isArray(club.matchHistory) ? club.matchHistory : []
  };

  return (
    <Tabs defaultValue="overview" className="mb-6">
      <TabsList className="grid grid-cols-3 mb-2">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="members">Members</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        <OverviewTab 
          club={safeClub}
          currentUser={currentUser}
          onSelectUser={handleSelectUser}
        />
      </TabsContent>
      
      <TabsContent value="members">
        <ClubMembersList
          members={safeClub.members}
          currentMatch={safeClub.currentMatch}
          onSelectMember={handleSelectUser}
        />
      </TabsContent>
      
      <TabsContent value="history">
        <MatchHistoryTab club={safeClub} />
      </TabsContent>
    </Tabs>
  );
};

// Loading skeleton for club tabs when data is not yet available
const ClubTabsLoadingSkeleton = () => {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-3 gap-1 mb-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
};

export default ClubDetailTabs;
