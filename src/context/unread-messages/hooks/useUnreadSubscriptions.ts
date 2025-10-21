
import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isConversationActive, refreshActiveTimestamp } from '@/utils/chat/activeConversationTracker';
import { isClubReadSince, isDmReadSince, getReadTimestamp } from '@/utils/chat/readStatusStorage';

interface UseUnreadSubscriptionsProps {
  currentUserId: string | undefined;
  isSessionReady: boolean;
  markConversationAsUnread: (conversationId: string, messageTimestamp?: number) => void;
  markClubAsUnread: (clubId: string, messageTimestamp?: number) => void;
  fetchUnreadCounts: () => Promise<void>;
}

export const useUnreadSubscriptions = ({
  currentUserId,
  isSessionReady,
  markConversationAsUnread,
  markClubAsUnread,
  fetchUnreadCounts
}: UseUnreadSubscriptionsProps) => {
  
  // Use refs to store handler functions to avoid closures with stale data
  const handlersRef = useRef({
    markConversationAsUnread,
    markClubAsUnread,
    fetchUnreadCounts
  });
  
  // Track message processing state to prevent duplicate processing
  const processingMessagesRef = useRef<Set<string>>(new Set());
  
  // Track unread counts locally for the first message case
  const [localUnreadClubs] = useState<Set<string>>(new Set());
  const [localUnreadConversations] = useState<Set<string>>(new Set());

  // Update refs when handlers change
  useEffect(() => {
    handlersRef.current = {
      markConversationAsUnread,
      markClubAsUnread,
      fetchUnreadCounts
    };
  }, [markConversationAsUnread, markClubAsUnread, fetchUnreadCounts]);
  
  // Handle badge refresh events with optimistic UI updates
  useEffect(() => {
    const handleBadgeRefresh = (event: CustomEvent) => {
      const { immediate, forceTotalRecalculation } = event.detail || {};
      
      if (forceTotalRecalculation) {
        // Force a full refresh of unread counts
        console.log('[useUnreadSubscriptions] Forcing total unread count recalculation');
        // Use requestAnimationFrame for immediate UI update and then fetch data
        requestAnimationFrame(() => {
          // Dispatch empty event first for optimistic UI update
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
          // Then fetch actual data
          setTimeout(() => {
            handlersRef.current.fetchUnreadCounts();
          }, 10); // Very small timeout to ensure UI gets updated first
        });
      } else if (immediate) {
        // Quick badge refresh - use requestAnimationFrame for smoother UI update
        console.log('[useUnreadSubscriptions] Immediate badge refresh requested');
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
        });
      }
    };
    
    window.addEventListener('badge-refresh-required', handleBadgeRefresh as EventListener);
    
    return () => {
      window.removeEventListener('badge-refresh-required', handleBadgeRefresh as EventListener);
    };
  }, []);
  
  // Handle conversation open events (to immediately refresh badges)
  useEffect(() => {
    const handleConversationOpened = (event: CustomEvent) => {
      const { type, id } = event.detail || {};
      
      if (!type || !id) return;
      
      console.log(`[useUnreadSubscriptions] Conversation opened: ${type} ${id}`);
      
      // Force an immediate badge refresh using requestAnimationFrame for smoother updates
      requestAnimationFrame(() => {
        window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
      });
      
      // For club conversations, also notify about read status change
      if (type === 'club') {
        window.dispatchEvent(new CustomEvent('club-read-status-changed', {
          detail: { clubId: id }
        }));
      } else {
        window.dispatchEvent(new CustomEvent('dm-read-status-changed', {
          detail: { conversationId: id }
        }));
      }
    };
    
    window.addEventListener('conversation-opened', handleConversationOpened as EventListener);
    
    return () => {
      window.removeEventListener('conversation-opened', handleConversationOpened as EventListener);
    };
  }, []);
  
  // Setup real-time subscriptions
  useEffect(() => {
    if (!isSessionReady || !currentUserId) return;
    
    console.log('[useUnreadSubscriptions] Setting up realtime subscriptions for user:', currentUserId);
    
    // Use local micro-batching for unread updates to prevent cascading re-renders
    let pendingUpdates = new Set<{ id: string, timestamp?: number, messageId?: string }>();
    let pendingClubUpdates = new Set<{ id: string, timestamp?: number, messageId?: string }>();
    let updateTimeout: NodeJS.Timeout | null = null;
    
    // Batch-process updates with requestAnimationFrame for smoother UI
    const processUpdates = () => {
      if (pendingUpdates.size > 0) {
        pendingUpdates.forEach(update => {
          // Skip if this message is already being processed
          if (update.messageId && processingMessagesRef.current.has(update.messageId)) {
            return;
          }
          
          // Mark as being processed
          if (update.messageId) {
            processingMessagesRef.current.add(update.messageId);
          }
          
          // Check if conversation is active before marking as unread
          const isActive = isConversationActive('dm', update.id);
          console.log(`[useUnreadSubscriptions] Checking if DM ${update.id} is active: ${isActive}`);
          
          if (!isActive) {
            // Also check if it's been read locally since this message
            if (!update.timestamp || !isDmReadSince(update.id, update.timestamp)) {
              handlersRef.current.markConversationAsUnread(update.id, update.timestamp);
              localUnreadConversations.add(update.id);
              
              // Trigger optimistic UI update right away
              requestAnimationFrame(() => {
                window.dispatchEvent(new CustomEvent('dm-unread-status-changed', { 
                  detail: { conversationId: update.id } 
                }));
              });
            }
          } else {
            // If conversation is active, refresh the timestamp to prevent races
            refreshActiveTimestamp('dm', update.id);
            
            // Also mark the message as read if it's active
            if (update.messageId) {
              try {
                supabase.rpc('mark_message_as_read', {
                  p_message_id: update.messageId,
                  p_user_id: currentUserId,
                  p_message_type: 'dm'
                });
              } catch (error) {
                console.error('[useUnreadSubscriptions] Error marking active DM message as read:', error);
              }
            }
          }
          
          // Remove from processing set after a short delay
          if (update.messageId) {
            setTimeout(() => {
              processingMessagesRef.current.delete(update.messageId as string);
            }, 5000); // Keep in set for 5 seconds to prevent duplicate processing
          }
        });
        pendingUpdates.clear();
      }
      
      if (pendingClubUpdates.size > 0) {
        pendingClubUpdates.forEach(update => {
          // Skip if this message is already being processed
          if (update.messageId && processingMessagesRef.current.has(update.messageId)) {
            return;
          }
          
          // Mark as being processed
          if (update.messageId) {
            processingMessagesRef.current.add(update.messageId);
          }
          
          // Check if club is active
          const isActive = isConversationActive('club', update.id);
          console.log(`[useUnreadSubscriptions] Checking if club ${update.id} is active: ${isActive}`);
          
          if (!isActive) {
            // Also check if it's been read locally since this message
            if (!update.timestamp || !isClubReadSince(update.id, update.timestamp)) {
              handlersRef.current.markClubAsUnread(update.id, update.timestamp);
              localUnreadClubs.add(update.id);
              
              // Trigger optimistic UI update right away
              requestAnimationFrame(() => {
                window.dispatchEvent(new CustomEvent('club-unread-status-changed', { 
                  detail: { clubId: update.id } 
                }));
              });
            }
          } else {
            // If club is active, refresh the timestamp to prevent races
            refreshActiveTimestamp('club', update.id);
            
            // Also mark the message as read if conversation is active
            if (update.messageId) {
              try {
                supabase.rpc('mark_message_as_read', {
                  p_message_id: update.messageId,
                  p_user_id: currentUserId,
                  p_message_type: 'club'
                });
              } catch (error) {
                console.error('[useUnreadSubscriptions] Error marking active club message as read:', error);
              }
            }
          }
          
          // Remove from processing set after a short delay
          if (update.messageId) {
            setTimeout(() => {
              processingMessagesRef.current.delete(update.messageId as string);
            }, 5000); // Keep in set for 5 seconds to prevent duplicate processing
          }
        });
        pendingClubUpdates.clear();
      }
      
      // Only dispatch one event regardless of how many updates
      if (pendingUpdates.size > 0 || pendingClubUpdates.size > 0) {
        requestAnimationFrame(() => {
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
        });
      }
      
      updateTimeout = null;
    };
    
    // Queue an update with reduced debounce delay
    const queueUpdate = () => {
      if (updateTimeout) return;
      updateTimeout = setTimeout(() => {
        requestAnimationFrame(processUpdates);
      }, 50); // Reduced from 200ms to 50ms for faster updates
    };
    
    // Handle club message events with optimistic UI updates
    const handleUnreadClubMessage = (event: CustomEvent) => {
      const { clubId, messageTimestamp, messageId } = event.detail || {};
      
      if (!clubId) return;
      
      // Skip if this message is already being processed
      if (messageId && processingMessagesRef.current.has(messageId)) {
        return;
      }
      
      // Check if it's the first unread message for this club
      const isFirstUnread = !localUnreadClubs.has(clubId);
      
      // Check for active conversation immediately
      const isActive = isConversationActive('club', clubId);
      console.log(`[useUnreadSubscriptions] Club message received. Club ${clubId} active: ${isActive}`);
      
      // If conversation is active, just refresh timestamp and mark as read
      if (isActive) {
        refreshActiveTimestamp('club', clubId);
        
        // If active, mark the message as read
        if (messageId) {
          try {
            supabase.rpc('mark_message_as_read', {
              p_message_id: messageId,
              p_user_id: currentUserId,
              p_message_type: 'club'
            });
          } catch (error) {
            console.error('[useUnreadSubscriptions] Error marking active club message as read:', error);
          }
        }
        return;
      }
      
      // If this is the first unread message, handle it specially with immediate UI feedback
      if (isFirstUnread) {
        console.log(`[useUnreadSubscriptions] First unread message for club ${clubId}`);
        
        // Double-check active status
        if (!isConversationActive('club', clubId)) {
          if (!messageTimestamp || !isClubReadSince(clubId, messageTimestamp)) {
            // Add to processing set
            if (messageId) {
              processingMessagesRef.current.add(messageId);
            }
            
            handlersRef.current.markClubAsUnread(clubId, messageTimestamp);
            localUnreadClubs.add(clubId);
            
            // Force an immediate UI update using requestAnimationFrame
            requestAnimationFrame(() => {
              // Dispatch event for badge update
              window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
              
              // Also dispatch specific event for clubId
              window.dispatchEvent(new CustomEvent('club-unread-status-changed', { 
                detail: { clubId } 
              }));
            });
            
            // Remove from processing set after a short delay
            if (messageId) {
              setTimeout(() => {
                processingMessagesRef.current.delete(messageId);
              }, 5000);
            }
          }
        } else if (messageId) {
          // If active, mark the message as read
          try {
            supabase.rpc('mark_message_as_read', {
              p_message_id: messageId,
              p_user_id: currentUserId,
              p_message_type: 'club'
            });
          } catch (error) {
            console.error('[useUnreadSubscriptions] Error marking active club message as read:', error);
          }
        }
      } else {
        // For subsequent messages, use the normal batching process but ensure UI is updated quickly
        pendingClubUpdates.add({
          id: clubId,
          timestamp: messageTimestamp,
          messageId
        });
        queueUpdate();
      }
    };
    
    window.addEventListener('unread-club-message', handleUnreadClubMessage as EventListener);
    
    // Set up real-time subscriptions for new messages with optimistic UI updates
    const dmChannel = supabase
      .channel('global-dm-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'direct_messages' 
          },
          (payload) => {
            if (payload.new.sender_id !== currentUserId && 
                payload.new.unread_by && 
                Array.isArray(payload.new.unread_by) && 
                payload.new.unread_by.includes(currentUserId)) {
              console.log('[useUnreadSubscriptions] New unread DM detected:', payload.new.id);
              
              // Skip if this message is already being processed
              if (processingMessagesRef.current.has(payload.new.id)) {
                return;
              }
              
              // Extract timestamp from the message
              const timestamp = new Date(payload.new.created_at || payload.new.timestamp).getTime();
              
              // Check if it's the first unread message for this conversation
              const isFirstUnread = !localUnreadConversations.has(payload.new.conversation_id);
              
              // Check for active conversation immediately
              const isActive = isConversationActive('dm', payload.new.conversation_id);
              console.log(`[useUnreadSubscriptions] DM received. Conversation ${payload.new.conversation_id} active: ${isActive}`);
              
              // If conversation is active, mark as read and exit
              if (isActive) {
                refreshActiveTimestamp('dm', payload.new.conversation_id);
                
                // Mark the message as read if conversation is active
                try {
                  supabase.rpc('mark_message_as_read', {
                    p_message_id: payload.new.id,
                    p_user_id: currentUserId,
                    p_message_type: 'dm'
                  });
                } catch (error) {
                  console.error('[useUnreadSubscriptions] Error marking active DM message as read:', error);
                }
                
                return;
              }
              
              // For first unread message, provide immediate UI feedback
              if (isFirstUnread) {
                console.log(`[useUnreadSubscriptions] First unread message for DM ${payload.new.conversation_id}`);
                
                // Double-check active status
                if (!isConversationActive('dm', payload.new.conversation_id)) {
                  if (!timestamp || !isDmReadSince(payload.new.conversation_id, timestamp)) {
                    // Add to processing set
                    processingMessagesRef.current.add(payload.new.id);
                    
                    handlersRef.current.markConversationAsUnread(payload.new.conversation_id, timestamp);
                    localUnreadConversations.add(payload.new.conversation_id);
                    
                    // Force immediate UI update using requestAnimationFrame
                    requestAnimationFrame(() => {
                      // Update badge counts
                      window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
                      
                      // Also dispatch specific event
                      window.dispatchEvent(new CustomEvent('dm-unread-status-changed', { 
                        detail: { conversationId: payload.new.conversation_id } 
                      }));
                    });
                    
                    // Remove from processing set after a short delay
                    setTimeout(() => {
                      processingMessagesRef.current.delete(payload.new.id);
                    }, 5000);
                  }
                } else {
                  // If active, mark the message as read
                  try {
                    supabase.rpc('mark_message_as_read', {
                      p_message_id: payload.new.id,
                      p_user_id: currentUserId,
                      p_message_type: 'dm'
                    });
                  } catch (error) {
                    console.error('[useUnreadSubscriptions] Error marking active DM message as read:', error);
                  }
                }
              } else {
                // Queue the update for batch processing but ensure UI gets updated quickly
                pendingUpdates.add({
                  id: payload.new.conversation_id,
                  timestamp,
                  messageId: payload.new.id
                });
                queueUpdate();
              }
            }
          })
      .subscribe();
    
    // Subscribe to new club messages
    const clubChannel = supabase.channel('global-club-unread-tracking')
      .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'club_chat_messages'
          },
          (payload) => {
            if (payload.new.sender_id !== currentUserId && 
                payload.new.unread_by && 
                Array.isArray(payload.new.unread_by) && 
                payload.new.unread_by.includes(currentUserId)) {
              console.log('[useUnreadSubscriptions] New unread club message detected:', payload.new.id);
              
              // Extract timestamp from the message
              const timestamp = new Date(payload.new.created_at || payload.new.timestamp).getTime();
              
              // Check if this conversation is currently active
              if (!isConversationActive('club', payload.new.club_id)) {
                // Check if this message has been read locally already
                if (!isClubReadSince(payload.new.club_id, timestamp)) {
                  // Dispatch an unread club message event
                  window.dispatchEvent(new CustomEvent('unread-club-message', { 
                    detail: { 
                      clubId: payload.new.club_id,
                      messageTimestamp: timestamp,
                      messageId: payload.new.id
                    } 
                  }));
                  
                  // Also dispatch message preview update event
                  window.dispatchEvent(new CustomEvent('message-preview-update', { 
                    detail: { 
                      type: 'club',
                      id: payload.new.club_id,
                      message: payload.new.message,
                      timestamp
                    } 
                  }));
                }
              } else {
                // Refresh the active timestamp to prevent race conditions
                refreshActiveTimestamp('club', payload.new.club_id);
                
                // Also mark the message as read if conversation is active
                try {
                  supabase.rpc('mark_message_as_read', {
                    p_message_id: payload.new.id,
                    p_user_id: currentUserId,
                    p_message_type: 'club'
                  });
                } catch (error) {
                  console.error('[useUnreadSubscriptions] Error marking active club message as read:', error);
                }
              }
            }
          })
      .subscribe();
      
    // Initial fetch of unread counts
    handlersRef.current.fetchUnreadCounts();
    
    // Set up a periodic refresh for unread counts
    const refreshInterval = setInterval(() => {
      handlersRef.current.fetchUnreadCounts();
    }, 60000); // Every minute
      
    return () => {
      supabase.removeChannel(dmChannel);
      supabase.removeChannel(clubChannel);
      window.removeEventListener('unread-club-message', handleUnreadClubMessage as EventListener);
      clearInterval(refreshInterval);
      
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [currentUserId, isSessionReady, localUnreadClubs, localUnreadConversations]);
};
