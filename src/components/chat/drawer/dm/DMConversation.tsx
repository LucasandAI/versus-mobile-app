
import React, { useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import ChatMessages from '../../ChatMessages';
import { useActiveDMMessages } from '@/hooks/chat/dm/useActiveDMMessages';
import { useDMSubscription } from '@/hooks/chat/dm/useDMSubscription';
import { useNavigation } from '@/hooks/useNavigation';
import { useConversations } from '@/hooks/chat/dm/useConversations';
import { useMessageFormatting } from '@/hooks/chat/messages/useMessageFormatting';
import { useConversationManagement } from '@/hooks/chat/dm/useConversationManagement';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';
import { useMessageScroll } from '@/hooks/chat/useMessageScroll';
import { useMessageReadStatus } from '@/hooks/chat/useMessageReadStatus';
import DMMessageInput from './DMMessageInput';
import DMHeader from './DMHeader';
import { ArrowLeft } from 'lucide-react';
import { useUserData } from '@/hooks/chat/dm/useUserData';
import { setActiveConversation, clearActiveConversation } from '@/utils/chat/activeConversationTracker';
import { resetConversationBadge } from '@/utils/chat/unifiedBadgeManager';

interface DMConversationProps {
  user: {
    id: string;
    name: string;
    avatar: string;
  };
  conversationId: string;
  onBack: () => void;
}

// Use memo to prevent unnecessary re-renders
const DMConversation: React.FC<DMConversationProps> = memo(({ 
  user, 
  conversationId,
  onBack
}) => {
  const { currentUser } = useApp();
  const { navigateToUserProfile } = useNavigation();
  const { markDirectMessagesAsRead, flushReadStatus } = useMessageReadStatus();
  const [isSending, setIsSending] = React.useState(false);
  const { formatTime } = useMessageFormatting();
  const activeMountRef = useRef(false);
  
  // Validate user data completeness at the component level
  const hasCompleteUserData = Boolean(user && user.id && user.name && user.avatar);
  
  // Log comprehensive user data validation
  console.log(`[DMConversation] User data validation:`, {
    id: user?.id || 'missing',
    name: user?.name || 'missing',
    avatar: user?.avatar || 'missing',
    isComplete: hasCompleteUserData
  });
  
  // If user data is incomplete, don't proceed with rendering the conversation
  if (!hasCompleteUserData) {
    return (
      <div className="flex flex-col h-full w-full">
        <div className="border-b p-3 flex items-center">
          <button 
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-9"></div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Loading conversation data...</p>
        </div>
      </div>
    );
  }
  
  // Create a stable reference to the user object that won't change identity
  const userDataForMessages = useMemo(() => ({
    id: user.id,
    name: user.name,
    avatar: user.avatar
  }), [user.id, user.name, user.avatar]);
  
  // Use our hook for active messages - pass the userDataForMessages as source of truth
  const { messages, setMessages, addOptimisticMessage } = useActiveDMMessages(
    conversationId, 
    user.id,
    currentUser?.id,
    userDataForMessages // Pass the authoritative user data to useActiveDMMessages
  );
  
  // Pass the complete user data object to useDMSubscription to ensure consistent display
  useDMSubscription(
    conversationId, 
    user.id, 
    currentUser?.id, 
    setMessages,
    userDataForMessages // This is the authoritative source of user metadata
  );
  
  // Use scroll management hook with optimized scrolling
  const { scrollRef, lastMessageRef, scrollToBottom } = useMessageScroll(messages);
  
  // Custom hooks for conversation management
  const { createConversation } = useConversationManagement(currentUser?.id, user.id);
  
  // Setup active conversation status on mount
  useEffect(() => {
    // Mark this component as mounted
    activeMountRef.current = true;
    
    if (conversationId && conversationId !== 'new') {
      console.log(`[DMConversation] Conversation opened: ${conversationId}`);
      
      // 1. Mark as active IMMEDIATELY (synchronously)
      setActiveConversation('dm', conversationId);
      
      // 2. Reset badge for this conversation
      resetConversationBadge(conversationId);
      
      // 3. Mark messages as read with a short delay to ensure active status is recognized
      const readTimer = setTimeout(() => {
        if (!activeMountRef.current) return; // Skip if unmounted
        
        console.log(`[DMConversation] Marking conversation ${conversationId} as read after delay`);
        markDirectMessagesAsRead(conversationId, true); // Use immediate=true to flush
      }, 200); // Short delay to ensure active status propagates
      
      return () => {
        // Mark as unmounted
        activeMountRef.current = false;
        
        // Clean up timers
        clearTimeout(readTimer);
        
        // Clear active conversation
        clearActiveConversation();
      };
    }
  }, [conversationId, markDirectMessagesAsRead]);

  // Additional handler for new messages - mark as read immediately
  useEffect(() => {
    if (!messages.length || !conversationId || conversationId === 'new') return;
    
    const handleNewMessage = (event: CustomEvent) => {
      if (!event.detail || !activeMountRef.current) return;
      
      if (event.detail.conversationId === conversationId) {
        console.log(`[DMConversation] New message detected for open conversation ${conversationId}`);
        
        // Mark conversation as active
        setActiveConversation('dm', conversationId);
        
        // Reset badge for this conversation
        resetConversationBadge(conversationId);
        
        // Mark as read immediately
        setTimeout(() => {
          if (activeMountRef.current) { // Only if still mounted
            markDirectMessagesAsRead(conversationId, true);
          }
        }, 50); // Very short delay
      }
    };
    
    // Listen for new messages in this conversation
    window.addEventListener('direct-message-received', handleNewMessage as EventListener);
    
    return () => {
      window.removeEventListener('direct-message-received', handleNewMessage as EventListener);
    };
  }, [conversationId, messages.length, markDirectMessagesAsRead]);

  // Handle back button click with proper cleanup
  const handleBack = useCallback(() => {
    // Flush any pending read status updates
    flushReadStatus();
    clearActiveConversation();
    onBack();
  }, [flushReadStatus, onBack]);

  // Stable send message handler
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentUser?.id) return;
    
    setIsSending(true);
    
    // Create optimistic message with stable ID format
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const optimisticMessage = {
      id: optimisticId,
      text,
      sender: {
        id: currentUser.id,
        name: currentUser.name || 'You',
        avatar: currentUser.avatar
      },
      timestamp: new Date().toISOString(),
      optimistic: true
    };
    
    // Add optimistic message to UI
    addOptimisticMessage(optimisticMessage);
    
    // Scroll to bottom - wrapped in requestAnimationFrame to avoid layout thrashing
    requestAnimationFrame(() => {
      scrollToBottom();
    });
    
    try {
      let finalConversationId = conversationId;
      
      // Create conversation if needed
      if (finalConversationId === 'new') {
        const newConversationId = await createConversation();
        if (newConversationId) {
          finalConversationId = newConversationId;
        } else {
          throw new Error("Failed to create conversation");
        }
      }
      
      // Mark as active immediately
      setActiveConversation('dm', finalConversationId);
      
      // Send message to database
      const { data, error } = await supabase
        .from('direct_messages')
        .insert({
          text,
          sender_id: currentUser.id,
          receiver_id: user.id,
          conversation_id: finalConversationId
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Mark as active again after sending to ensure it's still active
      setActiveConversation('dm', finalConversationId);
      
      // Mark as read immediately to prevent race conditions
      if (finalConversationId !== 'new') {
        // Small delay to ensure server has processed the message
        setTimeout(() => {
          markDirectMessagesAsRead(finalConversationId, true);
        }, 100);
      }
      
    } catch (error) {
      console.error('[DMConversation] Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  }, [currentUser, user, conversationId, addOptimisticMessage, createConversation, scrollToBottom, setMessages, markDirectMessagesAsRead]);
  
  // Club members array for ChatMessages - memoized to prevent recreating
  const clubMembers = useMemo(() => 
    currentUser ? [currentUser] : [], 
    [currentUser]
  );

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header with back button and centered user info */}
      <div className="border-b p-3 flex items-center">
        <button 
          onClick={handleBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 flex justify-center">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80" 
            onClick={() => navigateToUserProfile(user.id, user.name, user.avatar)}
          >
            <DMHeader 
              userId={user.id} 
              userName={user.name} 
              userAvatar={user.avatar} 
            />
          </div>
        </div>
        {/* This empty div helps maintain balance in the header */}
        <div className="w-9"></div>
      </div>
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 min-h-0">
          <ChatMessages 
            messages={messages}
            clubMembers={clubMembers}
            onSelectUser={(userId, userName, userAvatar) => 
              navigateToUserProfile(userId, userName, userAvatar)
            }
            currentUserAvatar={currentUser?.avatar}
            lastMessageRef={lastMessageRef}
            formatTime={formatTime}
            scrollRef={scrollRef}
          />
        </div>
        
        <DMMessageInput
          onSendMessage={handleSendMessage}
          isSending={isSending}
          userId={user.id}
          conversationId={conversationId}
        />
      </div>
    </div>
  );
});

DMConversation.displayName = 'DMConversation';

export default DMConversation;
