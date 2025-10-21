
import React, { useEffect, useState } from 'react';
import { Club, JoinRequest } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useJoinRequests } from '@/hooks/admin/useJoinRequests';
import JoinRequestItem from './JoinRequestItem';
import EmptyRequests from './EmptyRequests';
import { Skeleton } from "@/components/ui/skeleton";

interface JoinRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
}

const JoinRequestsDialog: React.FC<JoinRequestsDialogProps> = ({ 
  open, 
  onOpenChange, 
  club 
}) => {
  const {
    isLoading,
    error,
    requests,
    fetchClubRequests,
    handleAcceptRequest,
    handleDeclineRequest,
    isProcessing
  } = useJoinRequests();
  
  const isClubFull = club.members.length >= 5;
  
  useEffect(() => {
    const loadRequests = async () => {
      if (!open) return;
      console.log('[JoinRequestsDialog] Loading requests for club:', club.id);
      await fetchClubRequests(club.id);
    };
    
    loadRequests();
  }, [open, club.id, fetchClubRequests]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Requests</DialogTitle>
          <DialogDescription>
            Manage requests to join {club.name}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isClubFull && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
              <p className="text-sm text-yellow-800">
                This club is full (5/5 members). You need to remove a member before approving new requests.
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 w-16" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-red-500">Error loading requests. Please try again.</p>
            </div>
          ) : requests.length > 0 ? (
            <div className="space-y-4">
              {requests.map(request => (
                <JoinRequestItem
                  key={request.id}
                  request={request}
                  onApprove={() => handleAcceptRequest(request, club)}
                  onDeny={() => handleDeclineRequest(request)}
                  isClubFull={isClubFull}
                  isProcessing={isProcessing(request.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyRequests clubName={club.name} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinRequestsDialog;
