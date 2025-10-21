
import React from 'react';
import { User, Club } from '@/types';
import { UserPlus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from '@/components/shared/UserAvatar';
import { formatLeagueWithTier } from '@/lib/format';
import { useNavigation } from '@/hooks/useNavigation';

interface UserClubsProps {
  user: User;
  loading: boolean;
  onClubClick: (club: Club) => void;
}

const UserClubs: React.FC<UserClubsProps> = ({ user, loading, onClubClick }) => {
  const { navigateToClubDetail } = useNavigation();

  const handleClubClick = (club: Club) => {
    // Use our improved navigation method 
    navigateToClubDetail(club.id, club);
    
    // Also call the passed handler for backward compatibility
    onClubClick(club);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto mt-4 p-6 rounded-lg">
      <div className="flex items-center mb-4">
        <UserPlus className="text-green-500 mr-2 h-5 w-5" />
        <h3 className="text-lg font-semibold">Clubs</h3>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (user?.clubs || []).length > 0 ? (
        <div className="space-y-4">
          {(user?.clubs || []).map((club) => (
            <div 
              key={club.id} 
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => handleClubClick(club)}
            >
              <UserAvatar 
                name={club.name} 
                image={club.logo} 
                size="sm"
                className="w-12 h-12"
              />
              <div>
                <h4 className="font-medium">{club.name}</h4>
                <p className="text-sm text-gray-500">{formatLeagueWithTier(club.division, club.tier)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">No clubs joined yet</p>
      )}
    </Card>
  );
};

export default UserClubs;
