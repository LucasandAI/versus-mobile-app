
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from '@/components/shared/UserAvatar';

interface ProfileAvatarProps {
  loading: boolean;
  name: string;
  avatar: string;
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ loading, name, avatar }) => {
  if (loading) {
    return (
      <div className="h-24 w-24 rounded-full flex-shrink-0">
        <Skeleton className="h-full w-full rounded-full" />
      </div>
    );
  }

  return (
    <UserAvatar 
      name={name} 
      image={avatar} 
      size="lg" 
      className="h-24 w-24 flex-shrink-0"
    />
  );
};

export default ProfileAvatar;
