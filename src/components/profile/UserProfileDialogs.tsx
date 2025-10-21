
import React from "react";
import EditProfileDialog from './EditProfileDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { User } from '@/types';

interface UserProfileDialogsProps {
  editProfileOpen: boolean;
  setEditProfileOpen: (value: boolean) => void;
  currentUser: User | null;
  logoutDialogOpen: boolean;
  setLogoutDialogOpen: (value: boolean) => void;
  handleLogout: () => void;
}

const UserProfileDialogs: React.FC<UserProfileDialogsProps> = ({
  editProfileOpen,
  setEditProfileOpen,
  currentUser,
  logoutDialogOpen,
  setLogoutDialogOpen,
  handleLogout
}) => (
  <>
    <EditProfileDialog
      open={editProfileOpen}
      onOpenChange={setEditProfileOpen}
      user={currentUser}
    />
    <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
          <AlertDialogDescription>
            You'll need to log in again to access your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
);

export default UserProfileDialogs;
