
import React, { memo } from 'react';
import UserAvatar from '@/components/shared/UserAvatar';

interface DMHeaderProps {
  userId: string;
  userName: string;
  userAvatar?: string;
}

// Primary component that defines user metadata for the conversation
const DMHeader: React.FC<DMHeaderProps> = memo(({ userId, userName, userAvatar }) => {
  console.log(`[DMHeader] Providing authoritative user data: id=${userId}, name="${userName}", avatar="${userAvatar || 'undefined'}"`);
  
  return (
    <>
      <UserAvatar 
        name={userName} 
        image={userAvatar} 
        size="sm" 
      />
      <h3 className="font-semibold">{userName}</h3>
    </>
  );
});

DMHeader.displayName = 'DMHeader';

export default DMHeader;
