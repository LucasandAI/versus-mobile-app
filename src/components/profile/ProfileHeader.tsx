
import React from 'react';
import { User } from '@/types';
import AppHeader from '@/components/shared/AppHeader';

interface ProfileHeaderProps {
  currentUser: User | null;
  selectedUser: User | null;
  onBackClick: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  currentUser,
  selectedUser,
  onBackClick
}) => {
  return (
    <AppHeader
      title={currentUser?.id === selectedUser?.id ? 'Profile' : `${selectedUser?.name}'s Profile`}
      onBack={onBackClick}
    />
  );
};

export default ProfileHeader;
