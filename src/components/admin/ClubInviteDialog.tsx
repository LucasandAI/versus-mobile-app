
import React, { useState } from 'react';
import { User, Club } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { ShieldCheck, UsersRound } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClubNavigation } from '@/hooks/navigation/useClubNavigation';
import { useApp } from '@/context/AppContext';

interface ClubInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User;
  adminClubs: Club[];
}

const ClubInviteDialog: React.FC<ClubInviteDialogProps> = ({ 
  open, 
  onOpenChange, 
  user, 
  adminClubs 
}) => {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const { handleSendInvite } = useClubNavigation();
  const { currentUser } = useApp();

  const handleInvite = async () => {
    if (!selectedClub || !currentUser) {
      toast({
        title: "Error",
        description: "Please select a club to invite the user to.",
        variant: "destructive"
      });
      return;
    }

    const club = adminClubs.find(c => c.id === selectedClub);
    if (!club) return;

    const success = await handleSendInvite(user.id, user.name, club.id, club.name);
    
    if (success) {
      onOpenChange(false);
    }
  };

  const getClubMemberStatus = (club: Club) => {
    const isUserMember = user.clubs?.some(userClub => userClub.id === club.id);
    if (isUserMember) {
      return "member";
    }
    
    if (club.members.length >= 5) {
      return "full";
    }
    
    return "available";
  };

  const availableClubs = adminClubs.filter(club => 
    getClubMemberStatus(club) === "available"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to Club</DialogTitle>
          <DialogDescription>
            Invite {user.name} to join one of your clubs.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {availableClubs.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" />
                <span className="font-medium">Select a club</span>
              </div>
              
              <Select onValueChange={setSelectedClub} value={selectedClub || undefined}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a club" />
                </SelectTrigger>
                <SelectContent>
                  {availableClubs.map(club => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <p className="text-sm text-gray-500">
                This will send an invitation to {user.name}. They will need to accept the invitation to join the club.
              </p>
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-gray-500 mb-2">No clubs available for invitation</p>
              <p className="text-sm text-gray-400">
                {adminClubs.length === 0 
                  ? "You don't have any clubs you administer." 
                  : "The user is already a member of all your clubs or the clubs are full."}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button 
            onClick={handleInvite} 
            disabled={!selectedClub || availableClubs.length === 0}
          >
            <ShieldCheck className="mr-2 h-4 w-4" />
            Send Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClubInviteDialog;
