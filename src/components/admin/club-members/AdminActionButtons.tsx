
import React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Users } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface AdminActionButtonsProps {
  onEditClick: () => void;
  onRequestsClick: () => void;
  requestsCount?: number;
}

const AdminActionButtons: React.FC<AdminActionButtonsProps> = ({ 
  onEditClick, 
  onRequestsClick,
  requestsCount = 0
}) => {
  return (
    <div className="grid grid-cols-1 gap-2">
      <Button 
        variant="secondary" 
        size="sm" 
        className="flex items-center justify-center"
        onClick={onEditClick}
      >
        <Settings className="h-4 w-4 mr-2" />
        Edit Club Details
      </Button>
      
      <Button 
        variant="secondary" 
        size="sm" 
        className="flex items-center justify-center"
        onClick={onRequestsClick}
      >
        <Users className="h-4 w-4 mr-2" />
        View Join Requests
        {requestsCount > 0 && (
          <Badge variant="secondary" className="ml-2">
            {requestsCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default AdminActionButtons;
