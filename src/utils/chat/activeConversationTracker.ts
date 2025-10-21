
/**
 * Track which conversation is currently active/open
 * This ensures badge resets only affect the opened conversation
 */

interface ActiveConversation {
  type: 'dm' | 'club';
  id: string;
  timestamp: number;
}

let activeConversation: ActiveConversation | null = null;

/**
 * Mark a conversation as active (user has opened it)
 */
export const setActiveConversation = (type: 'dm' | 'club', id: string): void => {
  activeConversation = { type, id, timestamp: Date.now() };
  console.log(`[activeConversationTracker] Set active conversation: ${type} ${id}`);
};

/**
 * Mark a conversation as active (alias for setActiveConversation)
 */
export const markConversationActive = (type: 'dm' | 'club', id: string): void => {
  setActiveConversation(type, id);
};

/**
 * Check if a specific conversation is currently active
 */
export const isConversationActive = (type: 'dm' | 'club', id: string): boolean => {
  if (!activeConversation) return false;
  return activeConversation.type === type && activeConversation.id === id;
};

/**
 * Clear the active conversation
 */
export const clearActiveConversation = (): void => {
  console.log('[activeConversationTracker] Cleared active conversation');
  activeConversation = null;
};

/**
 * Clear active conversations (alias for clearActiveConversation)
 */
export const clearActiveConversations = (): void => {
  clearActiveConversation();
};

/**
 * Get the currently active conversation
 */
export const getActiveConversation = (): ActiveConversation | null => {
  return activeConversation;
};

/**
 * Refresh the timestamp of the active conversation
 */
export const refreshActiveTimestamp = (type: 'dm' | 'club', id: string): void => {
  if (activeConversation && activeConversation.type === type && activeConversation.id === id) {
    activeConversation.timestamp = Date.now();
    console.log(`[activeConversationTracker] Refreshed timestamp for ${type} ${id}`);
  }
};

/**
 * Check if a conversation has been viewed since a specific timestamp
 */
export const hasBeenViewedSince = (type: 'dm' | 'club', id: string, timestamp: number): boolean => {
  // This is a simplified check - in a full implementation you might want to store view timestamps
  return isConversationActive(type, id);
};
