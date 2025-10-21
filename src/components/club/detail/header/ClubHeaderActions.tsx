
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useJoinRequest } from '@/hooks/club/useJoinRequest';
import { useApp } from '@/context/AppContext';
import { Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClubHeaderActionsProps {
  isActuallyMember: boolean;
  isAdmin: boolean;
  memberCount: number;
  hasPendingInvite: boolean;
  onInvite: () => void;
  onLeaveClub: () => void;
  onJoinClub: () => void;
  onDeclineInvite: () => void;
  onRequestJoin: () => void;
  clubId: string;
}

const ClubHeaderActions: React.FC<ClubHeaderActionsProps> = ({
  isActuallyMember,
  isAdmin,
  memberCount,
  hasPendingInvite,
  onInvite,
  onLeaveClub,
  onJoinClub,
  onDeclineInvite,
  clubId,
}) => {
  const isClubFull = memberCount >= 5;
  const { currentUser } = useApp();
  const { 
    isRequesting, 
    hasPendingRequest, 
    sendJoinRequest, 
    cancelJoinRequest,
    checkPendingRequest 
  } = useJoinRequest(clubId);

  // Only check pending requests once when component mounts or when user changes
  useEffect(() => {
    if (currentUser?.id && !isActuallyMember) {
      checkPendingRequest(currentUser.id);
    }
  }, [currentUser?.id, isActuallyMember, checkPendingRequest]);

  const handleRequestJoin = async () => {
    if (!currentUser?.id || isRequesting) return;
    await sendJoinRequest(currentUser.id);
  };

  const handleCancelRequest = async () => {
    if (!currentUser?.id || isRequesting) return;
    await cancelJoinRequest(currentUser.id);
  };

  if (isActuallyMember) {
    if (isAdmin) {
      return (
        <div className="flex space-x-2">
          {memberCount < 5 && (
            <Button 
              variant="default" 
              size="sm"
              onClick={onInvite}
            >
              Invite Runner
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={onLeaveClub}
          >
            Leave Club
          </Button>
        </div>
      );
    }
    
    return (
      <Button 
        variant="outline" 
        size="sm"
        onClick={onLeaveClub}
      >
        Leave Club
      </Button>
    );
  }

  if (hasPendingInvite) {
    return (
      <div className="flex space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={onJoinClub}
                  disabled={isClubFull}
                >
                  Join Club
                </Button>
              </span>
            </TooltipTrigger>
            {isClubFull && (
              <TooltipContent>
                <p>This club is currently full</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onDeclineInvite}
        >
          Decline Invite
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button
              variant="default"
              size="sm"
              onClick={hasPendingRequest ? handleCancelRequest : handleRequestJoin}
              disabled={isRequesting || isClubFull}
            >
              {isRequesting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {hasPendingRequest ? 'Cancel Request' : 'Request to Join'}
            </Button>
          </span>
        </TooltipTrigger>
        {isClubFull && (
          <TooltipContent>
            <p>This club is currently full</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
};

export default ClubHeaderActions;
