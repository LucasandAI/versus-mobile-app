import React, { useEffect, useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { PopoverContent, PopoverTrigger, Popover } from "@/components/ui/popover";
import UserAvatar from '../../shared/UserAvatar';
import { Club } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';
interface ClubMembersPopoverProps {
  club: Club;
  onSelectUser?: (userId: string, userName: string, userAvatar?: string) => void;
}
const ClubMembersPopover: React.FC<ClubMembersPopoverProps> = ({
  club,
  onSelectUser
}) => {
  const [members, setMembers] = useState(club.members);
  const {
    navigateToUserProfile
  } = useNavigation();
  useEffect(() => {
    setMembers(club.members);
    const handleDataUpdate = () => {
      setMembers(club.members);
    };
    window.addEventListener('userDataUpdated', handleDataUpdate);
    return () => {
      window.removeEventListener('userDataUpdated', handleDataUpdate);
    };
  }, [club.members]);
  const handleUserClick = (member: any) => {
    if (onSelectUser) {
      onSelectUser(member.id, member.name, member.avatar);
    } else {
      navigateToUserProfile(member.id, member.name, member.avatar);
    }
  };
  return <Popover>
      <PopoverTrigger asChild>
        
      </PopoverTrigger>
      <PopoverContent className="w-60 p-2" align="start">
        <h4 className="text-sm font-medium mb-2">Club Members</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {members.map(member => <div key={member.id} className="w-full flex items-center gap-2 p-1.5 hover:bg-gray-100 rounded-md cursor-pointer" onClick={() => handleUserClick(member)}>
              <UserAvatar name={member.name} image={member.avatar} size="sm" className="cursor-pointer" onClick={e => {
            e && e.stopPropagation();
            handleUserClick(member);
          }} />
              <div className="flex-1">
                <span className="text-sm truncate cursor-pointer hover:text-primary">
                  {member.name}
                </span>
                {member.isAdmin && <span className="text-xs ml-2 bg-gray-100 px-1 py-0.5 rounded text-gray-600">
                    Admin
                  </span>}
              </div>
            </div>)}
        </div>
      </PopoverContent>
    </Popover>;
};
export default ClubMembersPopover;