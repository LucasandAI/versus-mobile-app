
import React from 'react';
import { Settings, LogOut } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import SocialLinksDropdown from '../social/SocialLinksDropdown';
import { User } from '@/types';

interface ProfileActionsProps {
  user: User;
  isCurrentUserProfile: boolean;
  onEditProfile: () => void;
  onLogoutClick: () => void;
  onShareProfile: () => void;
}

const ProfileActions: React.FC<ProfileActionsProps> = ({
  user,
  isCurrentUserProfile,
  onEditProfile,
  onLogoutClick,
  onShareProfile
}) => {
  return (
    <div className="flex justify-center space-x-4">
      {isCurrentUserProfile ? (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full"
                  onClick={onEditProfile}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Settings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <SocialLinksDropdown user={user} onShareProfile={onShareProfile} />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="rounded-full" 
                  onClick={onLogoutClick}
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Log Out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      ) : (
        <SocialLinksDropdown user={user} onShareProfile={onShareProfile} />
      )}
    </div>
  );
};

export default ProfileActions;
