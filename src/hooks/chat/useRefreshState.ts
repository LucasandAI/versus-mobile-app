
import { useState } from 'react';

export const useRefreshState = () => {
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const refreshChats = () => {
    console.log('[useRefreshState] Refreshing chats');
    setRefreshKey(Date.now());
  };

  return {
    refreshKey,
    refreshChats
  };
};
