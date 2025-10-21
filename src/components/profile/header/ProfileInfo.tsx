
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileInfoProps {
  loading: boolean;
  name: string;
  bio?: string;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ loading, name, bio }) => {
  if (loading) {
    return (
      <div className="flex-1">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-24 mt-2" />
      </div>
    );
  }

  return (
    <div className="flex-1">
      <h2 className="text-xl font-bold">{name || 'Unnamed Runner'}</h2>
      <p className="text-gray-500">{bio || 'No bio available'}</p>
    </div>
  );
};

export default ProfileInfo;
