
import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Loader2, UserPlus } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import UserAvatar from "../shared/UserAvatar";
import { useClubInvites } from '@/hooks/club/useClubInvites';
import { Skeleton } from '@/components/ui/skeleton';
import { isClubFull } from '@/utils/clubInviteActions';
import { toast } from 'sonner';

interface InviteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  clubName: string;
  memberCount?: number;
}

const InviteUserDialog: React.FC<InviteUserDialogProps> = ({ 
  open, 
  onOpenChange,
  clubId,
  clubName,
  memberCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullClub, setIsFullClub] = useState(false);
  const { users, loading, error, sendInvite, isProcessing } = useClubInvites(clubId, clubName);
  
  // Reset search query when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  // Check if club is full
  useEffect(() => {
    if (!open) return;
    
    const checkClubCapacity = async () => {
      if (memberCount !== undefined) {
        setIsFullClub(memberCount >= 5);
      } else {
        const full = await isClubFull(clubId);
        setIsFullClub(full);
      }
    };
    
    checkClubCapacity();
  }, [open, clubId, memberCount]);
  
  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    return users?.filter(user =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
  }, [users, searchQuery]);

  const handleInvite = async (userId: string, userName: string) => {
    if (isFullClub) {
      toast.error("This club is already full (5/5 members)");
      return;
    }
    
    const success = await sendInvite(userId, userName);
    
    if (success) {
      // Don't close dialog to allow multiple invites
      // onOpenChange(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-2">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center p-4 text-red-500">
          Error loading users: {error}
        </div>
      );
    }

    if (filteredUsers.length === 0) {
      return (
        <div className="text-center p-4 text-gray-500">
          {searchQuery ? 
            `No runners found matching "${searchQuery}"` : 
            "No available runners to invite"
          }
        </div>
      );
    }

    return filteredUsers.map(user => (
      <div 
        key={user.id} 
        className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md"
      >
        <div className="flex items-center gap-3">
          <UserAvatar 
            name={user.name}
            image={user.avatar || undefined}
            size="sm"
          />
          <span className="font-medium">{user.name}</span>
        </div>
        <Button
          size="sm"
          variant={user.alreadyInvited ? "secondary" : "default"}
          className="h-8"
          disabled={user.alreadyInvited || isProcessing(user.id) || isFullClub}
          onClick={() => handleInvite(user.id, user.name)}
        >
          {isProcessing(user.id) ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : user.alreadyInvited ? (
            "Invited"
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              Invite
            </>
          )}
        </Button>
      </div>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Runner</DialogTitle>
          <DialogDescription>
            Invite runners to join {clubName}
          </DialogDescription>
        </DialogHeader>
        
        {isFullClub && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
            <p className="text-sm text-yellow-800">
              This club is already full (5/5 members). You need to remove a member before inviting new runners.
            </p>
          </div>
        )}

        <div className="flex items-center border rounded-md px-3 py-2 mb-4">
          <Search className="h-4 w-4 text-gray-400 mr-2" />
          <Input
            placeholder="Search runners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 p-0 h-auto placeholder:text-gray-400"
          />
          {searchQuery && (
            <X 
              className="h-4 w-4 text-gray-400 cursor-pointer" 
              onClick={() => setSearchQuery('')}
            />
          )}
        </div>
        
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {renderContent()}
        </div>
        
        <div className="flex justify-end mt-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteUserDialog;
