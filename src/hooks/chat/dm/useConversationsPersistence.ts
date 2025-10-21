
export const useConversationsPersistence = () => {
  const STORAGE_KEY = 'direct_conversations';

  const loadConversationsFromStorage = () => {
    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (!storedData) return [];
      return JSON.parse(storedData);
    } catch (e) {
      console.error('Error loading conversations from storage:', e);
      return [];
    }
  };

  const saveConversationsToStorage = (conversations: any[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
      console.error('Error saving conversations to storage:', e);
    }
  };

  return {
    loadConversationsFromStorage,
    saveConversationsToStorage
  };
};
