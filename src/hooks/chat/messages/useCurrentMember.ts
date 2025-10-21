
import { useState, useEffect } from 'react';

export const useCurrentMember = (currentUserId: string | null, clubMembers: Array<{ id: string }>) => {
  const [currentUserInClub, setCurrentUserInClub] = useState<boolean>(false);
  
  useEffect(() => {
    if (currentUserId && clubMembers.length > 0) {
      const isInClub = clubMembers.some(member => String(member.id) === String(currentUserId));
      setCurrentUserInClub(isInClub);
    }
  }, [currentUserId, clubMembers]);

  return { currentUserInClub };
};
