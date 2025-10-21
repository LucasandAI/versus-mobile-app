
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { formatLeague } from '@/utils/club/leagueUtils';

interface NeedMoreMembersCardProps {
  club: Club;
  hideHeader?: boolean; // New prop to conditionally hide the header
}

const NeedMoreMembersCard: React.FC<NeedMoreMembersCardProps> = ({ 
  club,
  hideHeader = false // Default to showing the header
}) => {
  const { navigateToClubDetail } = useNavigation();
  
  const handleClubClick = () => {
    navigateToClubDetail(club.id, club);
  };

  return (
    <Card className="mb-4 overflow-hidden border-0 shadow-md">
      <CardContent className="p-0">
        {/* Only render the header if hideHeader is false */}
        {!hideHeader && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center">
              <UserAvatar
                name={club.name}
                image={club.logo}
                size="md"
                className="mr-3 cursor-pointer"
                onClick={handleClubClick}
              />
              <div>
                <h3 
                  className="font-semibold cursor-pointer hover:text-primary transition-colors"
                  onClick={handleClubClick}
                >
                  {club.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                    {formatLeague(club.division, club.tier)}
                  </span>
                  <span className="text-xs text-gray-500">
                    • {club.members.length} members
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="p-6 text-center">
          <div className="bg-amber-50 p-4 rounded-lg h-[100px] flex flex-col justify-center">
            <Users className="h-6 w-6 mx-auto text-amber-500 mb-2" />
            <h4 className="text-amber-800 font-medium mb-1">Need More Members</h4>
            <p className="text-amber-700 text-sm">
              Your club needs at least 5 members to compete.
            </p>
            <p className="text-amber-600 text-xs mt-1">
              Current: {club.members.length}/5 members
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NeedMoreMembersCard;
