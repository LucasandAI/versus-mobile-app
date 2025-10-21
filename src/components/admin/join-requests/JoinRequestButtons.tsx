
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShieldCheck, ShieldX } from 'lucide-react';
import { JoinRequest } from '@/types';
import { Loader2 } from 'lucide-react';

interface JoinRequestButtonsProps {
  request: JoinRequest;
  onDeny: () => void;
  onApprove: () => void;
  isClubFull: boolean;
  isProcessing: boolean;
}

const JoinRequestButtons: React.FC<JoinRequestButtonsProps> = ({
  request,
  onDeny,
  onApprove,
  isClubFull,
  isProcessing
}) => {
  return (
    <div className="flex gap-2">
      <Button 
        size="sm" 
        variant="outline"
        className="h-8"
        onClick={onDeny}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldX className="h-4 w-4 mr-1" />
        )}
        {!isProcessing && "Deny"}
      </Button>
      <Button 
        size="sm" 
        className="h-8"
        onClick={onApprove}
        disabled={isProcessing || isClubFull}
      >
        {isProcessing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4 mr-1" />
        )}
        {!isProcessing && "Approve"}
      </Button>
    </div>
  );
};

export default JoinRequestButtons;
