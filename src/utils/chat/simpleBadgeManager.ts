
/**
 * Simple utility for managing chat badge counts in local storage
 * This provides a local-first approach to managing unread message counts
 * without relying on complex database queries and subscriptions
 */

// Constants
const LOCAL_BADGE_COUNT_KEY = 'versus_badge_count';
const LOCAL_CONVERSATION_BADGES_KEY = 'versus_conversation_badges';

// Type for conversation-specific badge data
interface ConversationBadgeData {
  [conversationId: string]: number;
}

/**
 * Get conversation-specific badge counts from local storage
 */
export const getConversationBadges = (): ConversationBadgeData => {
  try {
    const data = localStorage.getItem(LOCAL_CONVERSATION_BADGES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[simpleBadgeManager] Error getting conversation badges:', error);
    return {};
  }
};

/**
 * Save conversation-specific badge data to local storage
 */
const saveConversationBadges = (data: ConversationBadgeData): void => {
  try {
    localStorage.setItem(LOCAL_CONVERSATION_BADGES_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[simpleBadgeManager] Error saving conversation badges:', error);
  }
};

/**
 * Get the current badge count from local storage
 */
export const getBadgeCount = (): number => {
  try {
    const count = localStorage.getItem(LOCAL_BADGE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('[simpleBadgeManager] Error getting badge count:', error);
    return 0;
  }
};

/**
 * Set the badge count in local storage
 */
export const setBadgeCount = (count: number): void => {
  try {
    // Ensure count is never negative
    const sanitizedCount = Math.max(0, count);
    localStorage.setItem(LOCAL_BADGE_COUNT_KEY, sanitizedCount.toString());
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('badge-count-changed', {
      detail: { count: sanitizedCount }
    }));
    
    console.log(`[simpleBadgeManager] Badge count set to: ${sanitizedCount}`);
  } catch (error) {
    console.error('[simpleBadgeManager] Error setting badge count:', error);
  }
};

/**
 * Get unread count for a specific conversation
 */
export const getConversationBadgeCount = (conversationId: string): number => {
  const badges = getConversationBadges();
  return badges[conversationId] || 0;
};

/**
 * Set unread count for a specific conversation and recalculate total
 */
export const setConversationBadgeCount = (conversationId: string, count: number): void => {
  try {
    const badges = getConversationBadges();
    const sanitizedCount = Math.max(0, count);
    
    if (sanitizedCount === 0) {
      delete badges[conversationId];
    } else {
      badges[conversationId] = sanitizedCount;
    }
    
    saveConversationBadges(badges);
    
    // Recalculate total badge count from all conversations
    const totalCount = Object.values(badges).reduce((sum, count) => sum + count, 0);
    setBadgeCount(totalCount);
    
    // Dispatch conversation-specific event
    window.dispatchEvent(new CustomEvent('conversation-badge-changed', {
      detail: { conversationId, count: sanitizedCount, totalCount }
    }));
    
    console.log(`[simpleBadgeManager] Conversation ${conversationId} badge count set to: ${sanitizedCount}, total: ${totalCount}`);
  } catch (error) {
    console.error('[simpleBadgeManager] Error setting conversation badge count:', error);
  }
};

/**
 * Initialize conversation-specific badge counts from database data
 */
export const initializeConversationBadges = (conversationCounts: Record<string, number>): void => {
  try {
    console.log('[simpleBadgeManager] Initializing conversation badges:', conversationCounts);
    
    // Save the conversation-specific counts
    saveConversationBadges(conversationCounts);
    
    // Calculate total count
    const totalCount = Object.values(conversationCounts).reduce((sum, count) => sum + count, 0);
    setBadgeCount(totalCount);
    
    console.log(`[simpleBadgeManager] Initialized with ${Object.keys(conversationCounts).length} conversations, total count: ${totalCount}`);
  } catch (error) {
    console.error('[simpleBadgeManager] Error initializing conversation badges:', error);
  }
};

/**
 * Increment the badge count for a specific conversation
 */
export const incrementConversationBadgeCount = (conversationId: string, amount: number = 1): number => {
  const currentCount = getConversationBadgeCount(conversationId);
  const newCount = currentCount + amount;
  setConversationBadgeCount(conversationId, newCount);
  return newCount;
};

/**
 * Reset the badge count for a specific conversation to 0
 */
export const resetConversationBadgeCount = (conversationId: string): void => {
  console.log(`[simpleBadgeManager] Resetting conversation badge count for: ${conversationId}`);
  setConversationBadgeCount(conversationId, 0);
};

/**
 * Increment the badge count by a specific amount (default: 1)
 */
export const incrementBadgeCount = (amount: number = 1): number => {
  const currentCount = getBadgeCount();
  const newCount = currentCount + amount;
  setBadgeCount(newCount);
  return newCount;
};

/**
 * Decrement the badge count by a specific amount (default: 1)
 * Only if it's greater than zero
 */
export const decrementBadgeCount = (amount: number = 1): number => {
  const currentCount = getBadgeCount();
  const newCount = Math.max(0, currentCount - amount);
  setBadgeCount(newCount);
  return newCount;
};

/**
 * Reset the badge count to zero
 */
export const resetBadgeCount = (): void => {
  setBadgeCount(0);
  // Also clear all conversation badges
  saveConversationBadges({});
};

/**
 * Initialize the badge count from the database
 * This should be called once at app startup
 */
export const initializeBadgeCountFromDatabase = (count: number): void => {
  console.log(`[simpleBadgeManager] Initializing badge count from database: ${count}`);
  setBadgeCount(count);
};

/**
 * Helper function to simulate a new message notification for a specific conversation
 */
export const simulateNewMessage = (conversationId?: string, conversationType?: 'dm' | 'club'): void => {
  if (conversationId) {
    incrementConversationBadgeCount(conversationId);
  } else {
    incrementBadgeCount();
  }
  
  // Dispatch event to notify components
  window.dispatchEvent(new CustomEvent('unread-message-received', {
    detail: conversationId && conversationType ? { conversationId, conversationType } : undefined
  }));
};

/**
 * Request a badge refresh from all components
 * This will trigger a full badge count recalculation if needed
 */
export const requestBadgeRefresh = (immediate: boolean = false): void => {
  window.dispatchEvent(new CustomEvent('badge-refresh-required', {
    detail: { immediate }
  }));
};
