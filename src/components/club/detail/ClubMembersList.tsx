
import React from 'react';
import { ClubMember, Match } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Users } from 'lucide-react';
import { useNavigation } from '@/hooks/useNavigation';
import { Skeleton } from "@/components/ui/skeleton";

interface ClubMembersListProps {
  members: ClubMember[] | undefined;
  currentMatch?: Match | null;
  onSelectMember?: (userId: string, name: string, avatar?: string) => void;
  onRefresh?: () => void;
}

const ClubMembersList: React.FC<ClubMembersListProps> = ({ 
  members, 
  currentMatch,
  onSelectMember,
  onRefresh
}) => {
  const { navigateToUserProfile } = useNavigation();
  
  // Handle undefined members
  if (!Array.isArray(members)) {
    return <MembersLoadingSkeleton />;
  }
  
  // Create a map to deduplicate members by ID
  const uniqueMembers = members.reduce((acc, member) => {
    if (member && member.id && !acc.has(member.id)) {
      // Ensure every member has a distanceContribution (default to 0)
      acc.set(member.id, {
        ...member,
        name: member.name || 'Unknown Member',
        avatar: member.avatar || '/placeholder.svg',
        isAdmin: !!member.isAdmin,
        distanceContribution: typeof member.distanceContribution === 'number' ? member.distanceContribution : 0
      });
    }
    return acc;
  }, new Map<string, ClubMember>());
  
  // Convert back to array
  const deduplicatedMembers = Array.from(uniqueMembers.values());

  const handleMemberClick = (member: ClubMember) => {
    if (!member || !member.id) return;
    
    if (onSelectMember) {
      onSelectMember(member.id, member.name || 'Unknown', member.avatar);
    } else {
      navigateToUserProfile(member.id, member.name || 'Unknown', member.avatar);
    }
  };

  // Add event listener for userDataUpdated event
  React.useEffect(() => {
    const handleDataUpdate = () => {
      if (onRefresh) {
        onRefresh();
      }
    };

    window.addEventListener('userDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleDataUpdate);
    };
  }, [onRefresh]);

  const MAX_MEMBERS = 5;
  const actualMemberCount = deduplicatedMembers.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center">
            <Users className="h-5 w-5 mr-2 text-primary" />
            Members
          </CardTitle>
          <span className="text-xs text-gray-500">
            {actualMemberCount}/{MAX_MEMBERS} members
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {deduplicatedMembers.length > 0 ? (
            deduplicatedMembers.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar 
                    name={member.name || 'Unknown'} 
                    image={member.avatar} 
                    size="sm" 
                    className="cursor-pointer"
                    onClick={() => handleMemberClick(member)}
                  />
                  <span 
                    className="hover:text-primary cursor-pointer"
                    onClick={() => handleMemberClick(member)}
                  >
                    {member.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {member.isAdmin && (
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                      Admin
                    </span>
                  )}
                  {currentMatch && (
                    <span className="font-medium text-xs text-gray-500">
                      {getDistanceContribution(currentMatch, member.id)} km
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-3 text-gray-500">
              No members found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper to safely get the distance contribution for a member
const getDistanceContribution = (match: Match, memberId: string): string => {
  if (!match || !match.homeClub || !match.homeClub.members || !Array.isArray(match.homeClub.members)) {
    return "0.0";
  }
  
  const member = match.homeClub.members.find(m => m && m.id === memberId);
  return member && typeof member.distanceContribution === 'number' 
    ? member.distanceContribution.toFixed(1) 
    : "0.0";
};

// Loading skeleton for members list when data is not yet available
const MembersLoadingSkeleton = () => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ClubMembersList;
