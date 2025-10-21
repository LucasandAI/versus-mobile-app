
import React from 'react';
import { Club } from '@/types';
import { getConversationBadgeCount } from '@/utils/chat/unifiedBadgeManager';

export function useClubPreviewData(clubs: Club[], clubMessages: Record<string, any[]>) {
  // Always recalculate lastMessages and sortedClubs on every render
  const lastMessages: Record<string, any> = {};
  const clubsWithTimestamps = clubs.map(club => {
    const messages = clubMessages[club.id] || [];
    // Always find the message with the highest timestamp
    const lastMessage = messages.reduce((latest, msg) => {
      if (!latest) return msg;
      return new Date(msg.timestamp).getTime() > new Date(latest.timestamp).getTime() ? msg : latest;
    }, null);
    if (lastMessage) {
      lastMessages[club.id] = lastMessage;
    }
    const lastTimestamp = lastMessage ? new Date(lastMessage.timestamp).getTime() : 0;
    return { club, lastTimestamp };
  });
  const sortedClubs = clubsWithTimestamps
    .sort((a, b) => b.lastTimestamp - a.lastTimestamp)
    .map(item => item.club);

  // Add conversation-specific unread counts for each club using unified system
  const clubsWithUnreadCounts = sortedClubs.map(club => {
    const unreadCount = getConversationBadgeCount(club.id);
    console.log(`[useClubPreviewData] Club ${club.name} (${club.id}) has ${unreadCount} unread messages`);
    return {
      ...club,
      unreadCount
    };
  });

  return { lastMessages, sortedClubs: clubsWithUnreadCounts };
}
