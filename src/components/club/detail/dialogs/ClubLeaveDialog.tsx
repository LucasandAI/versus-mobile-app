
import React, { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClubMember } from '@/types';
import { toast } from "@/hooks/use-toast";

interface ClubLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubName: string;
  onConfirm: (newAdminId?: string) => void;
  isAdmin: boolean;
  members: ClubMember[];
  currentUserId: string;
}

const ClubLeaveDialog: React.FC<ClubLeaveDialogProps> = ({
  open,
  onOpenChange,
  clubName,
  onConfirm,
  isAdmin,
  members,
  currentUserId
}) => {
  const [selectedAdminId, setSelectedAdminId] = useState<string>('');
  const otherMembers = members.filter(member => member.id !== currentUserId);

  const handleConfirm = () => {
    if (isAdmin && otherMembers.length > 0 && !selectedAdminId) {
      toast({
        title: "Select New Admin",
        description: "Please select a new admin before leaving the club.",
        variant: "destructive"
      });
      return;
    }
    
    if (isAdmin && otherMembers.length === 0) {
      toast({
        title: "Cannot Leave Club",
        description: "You are the only member. You cannot leave without assigning a new admin.",
        variant: "destructive"
      });
      return;
    }

    onConfirm(selectedAdminId);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave {clubName}?</AlertDialogTitle>
          <AlertDialogDescription>
            {isAdmin ? (
              otherMembers.length > 0 ? 
                "As an admin, you must select a new admin before leaving the club." :
                "You are the only member in this club. You cannot leave without assigning a new admin."
            ) : (
              "Are you sure you want to leave this club? You will need to be invited again to rejoin."
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isAdmin && otherMembers.length > 0 && (
          <div className="mb-4">
            <Select
              value={selectedAdminId}
              onValueChange={setSelectedAdminId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new admin" />
              </SelectTrigger>
              <SelectContent>
                {otherMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-red-500 hover:bg-red-600"
            disabled={isAdmin && (otherMembers.length === 0 || !selectedAdminId)}
          >
            Leave Club
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ClubLeaveDialog;
