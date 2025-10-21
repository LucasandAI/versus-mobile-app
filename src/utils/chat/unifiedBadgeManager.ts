
/**
 * Unified Badge Management System
 * Single source of truth for all chat badge functionality
 */

// Constants
const CONVERSATION_BADGES_KEY = 'versus_conversation_badges';

// Type definitions
interface ConversationBadgeData {
  [conversationId: string]: number;
}

interface BadgeUpdateEvent {
  conversationId: string;
  count: number;
  totalCount: number;
}

/**
 * Core badge storage operations
 */
export const getConversationBadges = (): ConversationBadgeData => {
  try {
    const data = localStorage.getItem(CONVERSATION_BADGES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('[unifiedBadgeManager] Error reading badges:', error);
    return {};
  }
};

const saveConversationBadges = (data: ConversationBadgeData): void => {
  try {
    localStorage.setItem(CONVERSATION_BADGES_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[unifiedBadgeManager] Error saving badges:', error);
  }
};

/**
 * Get total badge count across all conversations
 */
export const getTotalBadgeCount = (): number => {
  const badges = getConversationBadges();
  return Object.values(badges).reduce((sum, count) => sum + count, 0);
};

/**
 * Get badge count for a specific conversation
 */
export const getConversationBadgeCount = (conversationId: string): number => {
  const badges = getConversationBadges();
  return badges[conversationId] || 0;
};

/**
 * Set badge count for a specific conversation
 */
export const setConversationBadgeCount = (conversationId: string, count: number): void => {
  const badges = getConversationBadges();
  const sanitizedCount = Math.max(0, count);
  
  if (sanitizedCount === 0) {
    delete badges[conversationId];
  } else {
    badges[conversationId] = sanitizedCount;
  }
  
  saveConversationBadges(badges);
  
  const totalCount = getTotalBadgeCount();
  
  // Dispatch events for UI updates
  window.dispatchEvent(new CustomEvent('unified-badge-update', {
    detail: { conversationId, count: sanitizedCount, totalCount } as BadgeUpdateEvent
  }));
  
  console.log(`[unifiedBadgeManager] Conversation ${conversationId} badge: ${sanitizedCount}, total: ${totalCount}`);
};

/**
 * Increment badge count for a specific conversation
 */
export const incrementConversationBadge = (conversationId: string, amount: number = 1): void => {
  const currentCount = getConversationBadgeCount(conversationId);
  setConversationBadgeCount(conversationId, currentCount + amount);
};

/**
 * Reset badge count for a specific conversation to 0
 */
export const resetConversationBadge = (conversationId: string): void => {
  console.log(`[unifiedBadgeManager] Resetting badge for conversation: ${conversationId}`);
  setConversationBadgeCount(conversationId, 0);
};

/**
 * Initialize all conversation badges from database data
 */
export const initializeConversationBadges = (conversationCounts: Record<string, number>): void => {
  console.log('[unifiedBadgeManager] Initializing badges:', conversationCounts);
  saveConversationBadges(conversationCounts);
  
  const totalCount = getTotalBadgeCount();
  window.dispatchEvent(new CustomEvent('unified-badge-update', {
    detail: { conversationId: 'all', count: 0, totalCount }
  }));
};

/**
 * Clear all badges (for logout, etc.)
 */
export const clearAllBadges = (): void => {
  saveConversationBadges({});
  window.dispatchEvent(new CustomEvent('unified-badge-update', {
    detail: { conversationId: 'all', count: 0, totalCount: 0 }
  }));
};
