import React, { useState, useEffect } from 'react';
import { Club, User } from '@/types';
import { ShieldAlert, Edit, Users, Trash } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { useApp } from '@/context/AppContext';
import EditClubDialog from './EditClubDialog';
import JoinRequestsDialog from './join-requests/JoinRequestsDialog';
import MembersManagement from './club-members/MembersManagement';
import DeleteClubDialog from './DeleteClubDialog';
import { useDeleteClub } from '@/hooks/club/useDeleteClub';
import Button from '@/components/shared/Button';
import { fetchClubJoinRequests } from '@/utils/notifications/joinRequestQueries';
import { Badge } from "@/components/ui/badge";

interface ClubAdminActionsProps {
  club: Club;
  currentUser: User | null;
}

const ClubAdminActions: React.FC<ClubAdminActionsProps> = ({
  club,
  currentUser
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const {
    setCurrentUser,
    setSelectedClub
  } = useApp();
  const {
    deleteClub,
    loading: deleting
  } = useDeleteClub();
  const [currentClub, setCurrentClub] = useState<Club>(club);

  useEffect(() => {
    setCurrentClub(club);

    // Fetch pending requests count
    const loadPendingRequests = async () => {
      if (club && club.id) {
        console.log('[ClubAdminActions] Fetching pending requests for club:', club.id);
        const requests = await fetchClubJoinRequests(club.id);
        console.log('[ClubAdminActions] Found pending requests:', requests.length);
        setPendingRequestsCount(requests.length);
      }
    };
    loadPendingRequests();

    // Refresh count every minute
    const interval = setInterval(loadPendingRequests, 60000);
    return () => clearInterval(interval);
  }, [club]);

  const isAdmin = currentUser && currentClub.members.some(member => member.id === currentUser.id && member.isAdmin);
  if (!isAdmin) return null;

  const handleRemoveMember = (memberId: string, memberName: string) => {
    const updatedMembers = currentClub.members.filter(member => member.id !== memberId);
    const updatedClub = {
      ...currentClub,
      members: updatedMembers
    };
    setSelectedClub(updatedClub);
    setCurrentClub(updatedClub);
    if (currentUser) {
      setCurrentUser(prev => {
        if (!prev) return prev;
        const userClubs = prev.clubs || [];
        const updatedUserClubs = userClubs.map(userClub => userClub.id === currentClub.id ? {
          ...userClub,
          members: updatedMembers
        } : userClub);
        return {
          ...prev,
          clubs: updatedUserClubs
        };
      });
    }
    toast({
      title: "Member Removed",
      description: `${memberName} has been removed from the club.`
    });
  };

  const handleMakeAdmin = (memberId: string, memberName: string) => {
    const updatedMembers = currentClub.members.map(member => member.id === memberId ? {
      ...member,
      isAdmin: true
    } : member);
    const updatedClub = {
      ...currentClub,
      members: updatedMembers
    };
    setSelectedClub(updatedClub);
    setCurrentClub(updatedClub);
    if (currentUser) {
      setCurrentUser(prev => {
        if (!prev) return prev;
        const userClubs = prev.clubs || [];
        const updatedUserClubs = userClubs.map(userClub => userClub.id === currentClub.id ? {
          ...userClub,
          members: updatedMembers
        } : userClub);
        return {
          ...prev,
          clubs: updatedUserClubs
        };
      });
    }
    toast({
      title: "Admin Role Granted",
      description: `${memberName} is now an admin of the club.`
    });
  };

  const handleDeleteConfirm = async () => {
    const ok = await deleteClub(currentClub);
    if (ok) setDeleteDialogOpen(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center mb-4">
        <ShieldAlert className="h-5 w-5 text-primary mr-2" />
        <h2 className="font-bold">Admin Actions</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button variant="secondary" size="sm" className="flex items-center justify-center" onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4 mr-2" />
          Edit Club
        </Button>
        
        <Button variant="secondary" size="sm" className="flex items-center justify-center" onClick={() => setRequestsDialogOpen(true)}>
          <Users className="h-4 w-4 mr-2" />
          View Requests
          {pendingRequestsCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center bg-gray-200 text-gray-800 text-xs font-medium rounded-full px-2 py-0.5">
              {pendingRequestsCount}
            </span>
          )}
        </Button>
      </div>

      <div className="mb-4">
        <MembersManagement club={currentClub} onMakeAdmin={handleMakeAdmin} onRemoveMember={handleRemoveMember} />
      </div>

      <Button variant="primary" size="sm" className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white" onClick={() => setDeleteDialogOpen(true)}>
        <Trash className="h-4 w-4 mr-2" />
        Delete Club
      </Button>

      <EditClubDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} club={currentClub} />

      <JoinRequestsDialog open={requestsDialogOpen} onOpenChange={setRequestsDialogOpen} club={currentClub} />

      <DeleteClubDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} club={currentClub} loading={deleting} onConfirmDelete={handleDeleteConfirm} />
    </div>
  );
};

export default ClubAdminActions;
