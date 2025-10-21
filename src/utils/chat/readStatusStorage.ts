
/**
 * Utility for managing read status of conversations in local storage
 * This provides a local-first approach to marking messages as read
 * before the database is updated
 */

// Import the badge manager functions
import { resetConversationBadgeCount, requestBadgeRefresh } from './simpleBadgeManager';

// Constants
const LOCAL_READ_STATUS_KEY = 'versus_read_status';

// Type for read status data
interface ReadStatusData {
  dms: Record<string, number>; // Conversation ID -> timestamp
  clubs: Record<string, number>; // Club ID -> timestamp
}

/**
 * Get all stored read statuses
 */
export const getLocalReadStatus = (): ReadStatusData => {
  try {
    const data = localStorage.getItem(LOCAL_READ_STATUS_KEY);
    if (!data) {
      return { dms: {}, clubs: {} };
    }
    return JSON.parse(data);
  } catch (error) {
    console.error('[readStatusStorage] Error getting local read status:', error);
    return { dms: {}, clubs: {} };
  }
};

/**
 * Save read status data to local storage
 */
const saveLocalReadStatus = (data: ReadStatusData): void => {
  try {
    localStorage.setItem(LOCAL_READ_STATUS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('[readStatusStorage] Error saving local read status:', error);
  }
};

/**
 * Validate conversation ID to ensure it's a valid string and not empty
 */
const isValidId = (id: any): boolean => {
  return typeof id === 'string' && id.trim().length > 0;
};

/**
 * Track active conversations to prevent badge decrementing on hover/preview
 */
let activeConversation: { type: 'dm' | 'club'; id: string; timestamp: number } | null = null;

/**
 * Check if a conversation is currently active
 */
export const isConversationActive = (type: 'dm' | 'club', id: string): boolean => {
  if (!activeConversation) return false;
  return activeConversation.type === type && activeConversation.id === id;
};

/**
 * Mark a conversation as active (user has actually opened it)
 */
export const markConversationActive = (type: 'dm' | 'club', id: string): void => {
  activeConversation = { type, id, timestamp: Date.now() };
  console.log(`[readStatusStorage] Marked conversation as active: ${type} ${id}`);
};

/**
 * Clear the active conversation
 */
export const clearActiveConversation = (): void => {
  activeConversation = null;
  console.log('[readStatusStorage] Cleared active conversation');
};

/**
 * Refresh the active timestamp to keep the conversation marked as active
 */
export const refreshActiveTimestamp = (type: 'dm' | 'club', id: string): void => {
  if (activeConversation && activeConversation.type === type && activeConversation.id === id) {
    activeConversation.timestamp = Date.now();
  }
};

/**
 * Mark a DM conversation as read locally
 * This should only be called when the user actually opens the conversation
 */
export const markDmReadLocally = (conversationId: string): boolean => {
  try {
    // Validate ID first
    if (!isValidId(conversationId)) {
      console.error(`[readStatusStorage] Invalid conversation ID: ${conversationId}`);
      return false;
    }

    const timestamp = Date.now();
    const data = getLocalReadStatus();
    
    // Update timestamp for this conversation
    data.dms[conversationId] = timestamp;
    
    // Save updated data
    saveLocalReadStatus(data);
    
    console.log(`[readStatusStorage] Marked DM ${conversationId} as read locally at ${timestamp}`);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('local-read-status-change', {
      detail: { type: 'dm', id: conversationId, timestamp }
    }));
    
    // Reset badge count for this specific conversation ONLY if it's active
    const isActiveConversation = isConversationActive('dm', conversationId);
    console.log(`[readStatusStorage] Is DM active conversation: ${isActiveConversation}`);
    
    if (isActiveConversation) {
      resetConversationBadgeCount(conversationId);
      console.log(`[readStatusStorage] Reset badge count for DM ${conversationId}`);
      
      // Notify about the conversation being opened
      window.dispatchEvent(new CustomEvent('conversation-opened', {
        detail: { type: 'dm', id: conversationId }
      }));
    }
    
    return true;
  } catch (error) {
    console.error('[readStatusStorage] Error marking DM as read locally:', error);
    return false;
  }
};

/**
 * Mark a club conversation as read locally
 * This should only be called when the user actually opens the conversation
 */
export const markClubReadLocally = (clubId: string): boolean => {
  try {
    // Validate ID first
    if (!isValidId(clubId)) {
      console.error(`[readStatusStorage] Invalid club ID: ${clubId}`);
      return false;
    }

    const timestamp = Date.now();
    const data = getLocalReadStatus();
    
    // Update timestamp for this club
    data.clubs[clubId] = timestamp;
    
    // Save updated data
    saveLocalReadStatus(data);
    
    console.log(`[readStatusStorage] Marked club ${clubId} as read locally at ${timestamp}`);
    
    // Dispatch event to notify other components
    window.dispatchEvent(new CustomEvent('local-read-status-change', {
      detail: { type: 'club', id: clubId, timestamp }
    }));
    
    // Reset badge count for this specific conversation ONLY if it's active
    const isActiveConversation = isConversationActive('club', clubId);
    console.log(`[readStatusStorage] Is club active conversation: ${isActiveConversation}`);
    
    if (isActiveConversation) {
      resetConversationBadgeCount(clubId);
      console.log(`[readStatusStorage] Reset badge count for club ${clubId}`);
      
      // Notify about the conversation being opened
      window.dispatchEvent(new CustomEvent('conversation-opened', {
        detail: { type: 'club', id: clubId }
      }));
    }
    
    return true;
  } catch (error) {
    console.error('[readStatusStorage] Error marking club as read locally:', error);
    return false;
  }
};

/**
 * Check if a DM conversation has been read since a specific timestamp
 */
export const isDmReadSince = (conversationId: string, messageTimestamp: number): boolean => {
  try {
    // Return false early for invalid IDs
    if (!isValidId(conversationId)) return false;
    
    const data = getLocalReadStatus();
    const readTimestamp = data.dms[conversationId];
    
    // If we have no read timestamp, it hasn't been read
    if (!readTimestamp) return false;
    
    // Check if the read timestamp is after the message timestamp
    return readTimestamp > messageTimestamp;
  } catch (error) {
    console.error('[readStatusStorage] Error checking DM read since:', error);
    return false;
  }
};

/**
 * Check if a club conversation has been read since a specific timestamp
 */
export const isClubReadSince = (clubId: string, messageTimestamp: number): boolean => {
  try {
    // Return false early for invalid IDs
    if (!isValidId(clubId)) return false;
    
    const data = getLocalReadStatus();
    const readTimestamp = data.clubs[clubId];
    
    // If we have no read timestamp, it hasn't been read
    if (!readTimestamp) return false;
    
    // Check if the read timestamp is after the message timestamp
    return readTimestamp > messageTimestamp;
  } catch (error) {
    console.error('[readStatusStorage] Error checking club read since:', error);
    return false;
  }
};

/**
 * Get the read timestamp for a specific conversation
 * Returns 0 if not found
 */
export const getReadTimestamp = (type: 'dm' | 'club', id: string): number => {
  try {
    // Return 0 for invalid IDs
    if (!isValidId(id)) return 0;
    
    const data = getLocalReadStatus();
    if (type === 'dm') {
      return data.dms[id] || 0;
    } else {
      return data.clubs[id] || 0;
    }
  } catch (error) {
    console.error('[readStatusStorage] Error getting read timestamp:', error);
    return 0;
  }
};

/**
 * Clear read status for testing or reset purposes
 */
export const clearReadStatus = (type: 'dm' | 'club', id: string): void => {
  try {
    if (!isValidId(id)) return;
    
    const data = getLocalReadStatus();
    if (type === 'dm') {
      delete data.dms[id];
    } else {
      delete data.clubs[id];
    }
    
    saveLocalReadStatus(data);
    
    console.log(`[readStatusStorage] Cleared ${type} read status for ${id}`);
    
    // Dispatch refresh event
    requestBadgeRefresh(true);
  } catch (error) {
    console.error('[readStatusStorage] Error clearing read status:', error);
  }
};
