
import React from 'react';
import { X } from 'lucide-react';
import { DrawerClose, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import UserAvatar from '@/components/shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { Club } from '@/types';

interface ChatDrawerHeaderProps {
  selectedClub?: Club | null;
}

const ChatDrawerHeader: React.FC<ChatDrawerHeaderProps> = ({
  selectedClub
}) => {
  const {
    navigateToClubDetail
  } = useNavigation();
  
  const handleClubClick = () => {
    if (selectedClub) {
      navigateToClubDetail(selectedClub.id, selectedClub);
    }
  };
  
  return (
    <DrawerHeader className="border-b px-4 py-3">
      {selectedClub && (
        <div className="flex items-center">
          <div 
            className="flex items-center cursor-pointer" 
            onClick={handleClubClick}
          >
            <UserAvatar 
              name={selectedClub.name} 
              image={selectedClub.logo || ''} 
              size="md" 
              className="mr-3" 
            />
            <DrawerTitle>{selectedClub.name}</DrawerTitle>
          </div>
          <DrawerClose className="ml-auto">
            <X className="h-5 w-5 text-gray-500 hover:text-gray-900" />
          </DrawerClose>
        </div>
      )}
    </DrawerHeader>
  );
};

export default ChatDrawerHeader;
