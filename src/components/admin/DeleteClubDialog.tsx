
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import Button from '../shared/Button';
import { Club } from '@/types';

interface DeleteClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  club: Club;
  loading?: boolean;
  onConfirmDelete: () => void;
}

const DeleteClubDialog: React.FC<DeleteClubDialogProps> = ({
  open,
  onOpenChange,
  club,
  loading = false,
  onConfirmDelete
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Delete Club</DialogTitle>
        <DialogDescription>
          Are you sure you want to delete <b>{club.name}</b>?<br />
          This will permanently remove the club and all related data.<br />
          <span className="text-destructive font-medium">This action cannot be undone.</span>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="flex items-center justify-end gap-2 pt-4">
        <Button variant="outline" size="sm" disabled={loading} onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button 
          variant="primary" 
          className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          size="sm"
          loading={loading}
          onClick={onConfirmDelete}
        >
          Delete Club
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default DeleteClubDialog;

