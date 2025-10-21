
/**
 * Test utilities for the badge count system
 * These functions are for development/testing only
 */

import { 
  getBadgeCount, 
  setBadgeCount, 
  incrementBadgeCount, 
  getConversationBadgeCount,
  setConversationBadgeCount,
  incrementConversationBadgeCount,
  resetConversationBadgeCount,
  simulateNewMessage,
  requestBadgeRefresh
} from './simpleBadgeManager';

// Get the current badge count
export const debugGetBadgeCount = (): void => {
  const count = getBadgeCount();
  console.log(`[badgeTestUtils] Current badge count: ${count}`);
};

// Set the badge count to a specific value
export const debugSetBadgeCount = (count: number): void => {
  console.log(`[badgeTestUtils] Setting badge count to: ${count}`);
  setBadgeCount(count);
};

// Add a message to the badge count
export const debugAddMessage = (count: number = 1): void => {
  console.log(`[badgeTestUtils] Adding ${count} message(s) to badge count`);
  incrementBadgeCount(count);
};

// Simulate a new message with UI notification
export const debugSimulateMessage = (): void => {
  console.log('[badgeTestUtils] Simulating new message');
  simulateNewMessage();
};

// Simulate a new message for a specific conversation
export const debugSimulateConversationMessage = (
  conversationId: string,
  conversationType: 'dm' | 'club'
): void => {
  console.log(`[badgeTestUtils] Simulating message for ${conversationType} ${conversationId}`);
  simulateNewMessage(conversationId, conversationType);
};

// Request badge refresh
export const debugRefreshBadgeCount = (): void => {
  console.log('[badgeTestUtils] Requesting badge refresh');
  requestBadgeRefresh(true);
};

// Test conversation-specific badge operations
export const debugGetConversationBadge = (conversationId: string): void => {
  const count = getConversationBadgeCount(conversationId);
  console.log(`[badgeTestUtils] Conversation ${conversationId} badge count: ${count}`);
};

export const debugSetConversationBadge = (conversationId: string, count: number): void => {
  console.log(`[badgeTestUtils] Setting conversation ${conversationId} badge count to: ${count}`);
  setConversationBadgeCount(conversationId, count);
};

export const debugIncrementConversationBadge = (conversationId: string, amount: number = 1): void => {
  console.log(`[badgeTestUtils] Incrementing conversation ${conversationId} badge count by: ${amount}`);
  incrementConversationBadgeCount(conversationId, amount);
};

export const debugResetConversationBadge = (conversationId: string): void => {
  console.log(`[badgeTestUtils] Resetting conversation ${conversationId} badge count`);
  resetConversationBadgeCount(conversationId);
};

// Test all badge count operations
export const runBadgeTest = (): void => {
  console.log('[badgeTestUtils] Running badge count test');
  
  // Get initial count
  const initialCount = getBadgeCount();
  console.log(`[badgeTestUtils] Initial badge count: ${initialCount}`);
  
  // Set to 5
  setBadgeCount(5);
  console.log('[badgeTestUtils] Set badge count to 5');
  
  // Increment by 3
  incrementBadgeCount(3);
  console.log('[badgeTestUtils] Incremented by 3');
  
  // Get new count
  const newCount = getBadgeCount();
  console.log(`[badgeTestUtils] New badge count: ${newCount}`);
  
  // Reset to initial count
  setBadgeCount(initialCount);
  console.log(`[badgeTestUtils] Reset badge count to ${initialCount}`);
};

// Test conversation-specific operations
export const runConversationBadgeTest = (conversationId: string = 'test-conversation'): void => {
  console.log(`[badgeTestUtils] Running conversation badge test for: ${conversationId}`);
  
  // Get initial count
  const initialCount = getConversationBadgeCount(conversationId);
  console.log(`[badgeTestUtils] Initial conversation badge count: ${initialCount}`);
  
  // Set to 3
  setConversationBadgeCount(conversationId, 3);
  console.log('[badgeTestUtils] Set conversation badge count to 3');
  
  // Increment by 2
  incrementConversationBadgeCount(conversationId, 2);
  console.log('[badgeTestUtils] Incremented conversation badge by 2');
  
  // Get new count
  const newCount = getConversationBadgeCount(conversationId);
  console.log(`[badgeTestUtils] New conversation badge count: ${newCount}`);
  
  // Get total count
  const totalCount = getBadgeCount();
  console.log(`[badgeTestUtils] Total badge count: ${totalCount}`);
  
  // Reset conversation count
  resetConversationBadgeCount(conversationId);
  console.log(`[badgeTestUtils] Reset conversation badge count to 0`);
};
