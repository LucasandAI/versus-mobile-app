
import React from 'react';
import { ClubMember, MatchTeam } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';

interface MatchDetailsProps {
  homeTeam: MatchTeam;
  awayTeam: MatchTeam;
  onSelectUser?: (userId: string, name: string, avatar?: string) => void;
}

const MatchDetails: React.FC<MatchDetailsProps> = ({ 
  homeTeam, 
  awayTeam,
  onSelectUser 
}) => {
  const ensureTeamSize = (members: ClubMember[], teamName: string): ClubMember[] => {
    const result = [...members];
    
    if (result.length < 5) {
      const existingMemberCount = result.length;
      for (let i = existingMemberCount; i < 5; i++) {
        const memberNumber = i + 1;
        result.push({
          id: `${teamName.toLowerCase()}-placeholder-${i}`,
          name: `Inactive Member ${memberNumber}`,
          avatar: '/placeholder.svg',
          isAdmin: false,
          distanceContribution: 0
        });
      }
    }
    
    // Sort by distance contributed, descending
    return result.sort((a, b) => (b.distanceContribution || 0) - (a.distanceContribution || 0));
  };

  const homeMembers = ensureTeamSize(homeTeam.members || [], homeTeam.name);
  const awayMembers = ensureTeamSize(awayTeam.members || [], awayTeam.name);

  const handleUserClick = (member: ClubMember) => {
    if (!member.id.includes('placeholder') && onSelectUser) {
      onSelectUser(member.id, member.name, member.avatar);
    }
  };

  const renderMemberRow = (member: ClubMember, teamName: string) => {
    const isRealMember = !member.id.includes('placeholder');
    const clickableClass = isRealMember ? 'cursor-pointer hover:text-primary' : 'text-gray-400';
    
    return (
      <div 
        key={member.id} 
        className="flex justify-between text-xs items-center"
        onClick={() => isRealMember && handleUserClick(member)}
      >
        <div className="flex items-center gap-2">
          <UserAvatar 
            name={member.name} 
            image={member.avatar} 
            size="xs" 
            className={isRealMember ? 'cursor-pointer' : 'opacity-50'}
            onClick={(e) => {
              e && e.stopPropagation();
              isRealMember && handleUserClick(member);
            }}
          />
          <span className={clickableClass}>{member.name}</span>
        </div>
        <span className="font-medium">
          {member.distanceContribution?.toFixed(1) || '0.0'} km
        </span>
      </div>
    );
  };

  return (
    <div className="mt-3 bg-gray-50 p-3 rounded-md space-y-3">
      <div>
        <h4 className="text-xs font-semibold mb-2">{homeTeam.name}</h4>
        <div className="space-y-1">
          {homeMembers.map(member => renderMemberRow(member, homeTeam.name))}
        </div>
      </div>
      
      <div>
        <h4 className="text-xs font-semibold mb-2">{awayTeam.name}</h4>
        <div className="space-y-1">
          {awayMembers.map(member => renderMemberRow(member, awayTeam.name))}
        </div>
      </div>
    </div>
  );
};

export default MatchDetails;
