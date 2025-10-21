
import { useState, useCallback } from 'react';

export const useClubMessageState = () => {
  const [clubMessages, setClubMessages] = useState<Record<string, any[]>>({});

  const safeSetClubMessages = useCallback((
    updater: React.SetStateAction<Record<string, any[]>>
  ) => {
    setClubMessages(prevState => {
      const nextState = typeof updater === 'function' 
        ? updater(prevState) 
        : updater;
      
      console.log('[useClubMessageState] State update:', {
        prevClubIds: Object.keys(prevState),
        nextClubIds: Object.keys(nextState)
      });
      
      return nextState;
    });
  }, []);

  return {
    clubMessages,
    setClubMessages: safeSetClubMessages
  };
};
