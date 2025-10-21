
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Club } from '@/types';
import UserAvatar from '../shared/UserAvatar';
import MatchProgressBar from '../shared/MatchProgressBar';
import { formatLeague } from '@/utils/club/leagueUtils';
import { useNavigation } from '@/hooks/useNavigation';

interface ClubCardProps {
  club: Club;
  onSelectUser: (userId: string, name: string, avatar?: string) => void;
}

const ClubCard: React.FC<ClubCardProps> = ({ 
  club, 
  onSelectUser 
}) => {
  const [expanded, setExpanded] = useState(false);
  const { navigateToClubDetail } = useNavigation();

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleClubClick = () => {
    // Use our improved navigation - we're already a member so the full data is in context
    navigateToClubDetail(club.id, club);
  };

  const handleClubNameClick = (e: React.MouseEvent, clubData: Partial<Club>) => {
    e.stopPropagation();
    navigateToClubDetail(clubData.id || '', clubData);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const MAX_MEMBERS = 5;

  if (!club.name) {
    return null;
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer"
      onClick={handleClubClick}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-shrink-0">
          <UserAvatar 
            name={club.name} 
            image={club.logo} 
            size="md"
            className="h-12 w-12 cursor-pointer"
            onClick={(e) => {
              e && e.stopPropagation();
              handleClubClick();
            }}
          />
        </div>
        <div>
          <h3 className="font-medium cursor-pointer hover:text-primary transition-colors" onClick={handleClubClick}>{club.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
              {formatLeague(club.division, club.tier)}
            </span>
            <span className="text-xs text-gray-500">
              • {club.members.length}/{MAX_MEMBERS} members
            </span>
          </div>
        </div>
      </div>

      {club.currentMatch && (
        <div className="border-t pt-3">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium">Current Match</h4>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              {getDaysRemaining(club.currentMatch.endDate)} days left
            </span>
          </div>
          
          <div className="flex justify-between items-center mb-3 text-sm">
            <span 
              className="font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={(e) => handleClubNameClick(e, club.currentMatch!.homeClub)}
            >
              {club.currentMatch.homeClub.name}
            </span>
            <span className="text-xs text-gray-500">vs</span>
            <span 
              className="font-medium cursor-pointer hover:text-primary transition-colors"
              onClick={(e) => handleClubNameClick(e, club.currentMatch!.awayClub)}
            >
              {club.currentMatch.awayClub.name}
            </span>
          </div>

          <MatchProgressBar
            homeDistance={club.currentMatch.homeClub.totalDistance}
            awayDistance={club.currentMatch.awayClub.totalDistance}
          />

          <div className="mt-4">
            <button 
              className="w-full py-2 text-sm text-primary flex items-center justify-center"
              onClick={toggleExpanded}
            >
              {expanded ? 'Hide Details' : 'View Details'} 
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
            
            {expanded && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs font-medium mb-2">Home Club Members</p>
                  {club.currentMatch.homeClub.members.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-2 mb-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser(member.id, member.name, member.avatar);
                      }}
                    >
                      <UserAvatar name={member.name} image={member.avatar} size="xs" />
                      <div>
                        <p className="text-xs font-medium hover:text-primary transition-colors">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.distanceContribution?.toFixed(1)} km</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-medium mb-2">Away Club Members</p>
                  {club.currentMatch.awayClub.members.map(member => (
                    <div 
                      key={member.id} 
                      className="flex items-center gap-2 mb-1 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectUser(member.id, member.name, member.avatar);
                      }}
                    >
                      <UserAvatar name={member.name} image={member.avatar} size="xs" />
                      <div>
                        <p className="text-xs font-medium hover:text-primary transition-colors">{member.name}</p>
                        <p className="text-xs text-gray-500">{member.distanceContribution?.toFixed(1)} km</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubCard;
