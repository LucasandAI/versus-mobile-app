
import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { UserMinus, UserCog } from 'lucide-react';

interface MemberActionsProps {
  memberId: string;
  memberName: string;
  onMakeAdmin: (id: string, name: string) => void;
  onRemove: (id: string, name: string) => void;
}

const MemberActions: React.FC<MemberActionsProps> = ({
  memberId,
  memberName,
  onMakeAdmin,
  onRemove
}) => {
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => onMakeAdmin(memberId, memberName)}
              data-testid={`make-admin-${memberId}`}
            >
              <UserCog className="h-4 w-4" />
              <span className="sr-only">Make Admin</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Make Admin</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50"
              onClick={() => onRemove(memberId, memberName)}
              data-testid={`remove-member-${memberId}`}
            >
              <UserMinus className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Remove Member</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default MemberActions;
