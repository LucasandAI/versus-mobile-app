
import React from 'react';
import { Button } from "@/components/ui/button";
import { UserPlus, MessageCircle } from 'lucide-react';
import ClubInviteDialog from '../admin/ClubInviteDialog';
import { User, Club } from '@/types';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';

interface UserInviteSectionProps {
  showInviteButton: boolean;
  inviteDialogOpen: boolean;
  setInviteDialogOpen: (open: boolean) => void;
  selectedUser: User;
  adminClubs: Club[];
  isCurrentUserProfile: boolean;
}

const UserInviteSection: React.FC<UserInviteSectionProps> = ({
  showInviteButton,
  inviteDialogOpen,
  setInviteDialogOpen,
  selectedUser,
  adminClubs,
  isCurrentUserProfile
}) => {
  const { open: openChatDrawer } = useChatDrawerGlobal();
  const { getOrCreateConversation } = useDirectConversationsContext();

  if (isCurrentUserProfile) return null;

  const handleMessageClick = async () => {
    // Open the chat drawer first
    openChatDrawer();
    
    try {
      // Get or create conversation with this user
      const conversation = await getOrCreateConversation(selectedUser.id, selectedUser.name, selectedUser.avatar);
      
      if (conversation) {
        // Dispatch custom event to open DM directly with this conversation
        const event = new CustomEvent('openDirectMessage', {
          detail: {
            userId: selectedUser.id,
            userName: selectedUser.name,
            userAvatar: selectedUser.avatar,
            conversationId: conversation.conversationId
          }
        });
        window.dispatchEvent(event);
        console.log('Direct message opened with user:', selectedUser.name);
      }
    } catch (error) {
      console.error('Error opening direct message:', error);
    }
  };

  return (
    <div className="flex gap-2 mt-2">
      <Button 
        variant="outline" 
        size="sm" 
        className="flex items-center gap-1"
        onClick={handleMessageClick}
      >
        <MessageCircle className="h-4 w-4" />
        Message
      </Button>
      
      {showInviteButton && (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Invite to Club
          </Button>
          
          <ClubInviteDialog 
            open={inviteDialogOpen}
            onOpenChange={setInviteDialogOpen}
            user={selectedUser}
            adminClubs={adminClubs}
          />
        </>
      )}
    </div>
  );
};

export default UserInviteSection;
