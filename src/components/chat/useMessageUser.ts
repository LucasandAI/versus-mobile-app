
import { useApp } from '@/context/AppContext';

export const useMessageUser = () => {
  const { currentUser } = useApp();
  
  return {
    currentUserId: currentUser?.id || null,
    currentUserAvatar: currentUser?.avatar || '/placeholder.svg'
  };
};
