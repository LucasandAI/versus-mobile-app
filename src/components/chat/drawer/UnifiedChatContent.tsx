
import React from 'react';
import { useState, useEffect } from 'react';
import { Club } from '@/types';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { supabase } from '@/integrations/supabase/client';
import ChatHeader from '../ChatHeader';
import ChatMessages from '../ChatMessages';
import ChatInput from '../ChatInput';
import { useNavigation } from '@/hooks/useNavigation';
import { useChatActions } from '@/hooks/chat/useChatActions';
import { useUnreadMessages } from '@/context/unread-messages';
import { useMessageReadStatus } from '@/hooks/chat/useMessageReadStatus';
import { ArrowLeft } from 'lucide-react';
import UserAvatar from '@/components/shared/UserAvatar';
import { setActiveConversation, clearActiveConversation } from '@/utils/chat/activeConversationTracker';
import { resetConversationBadge } from '@/utils/chat/unifiedBadgeManager';

interface UnifiedChatContentProps {
  selectedChat: {
    type: 'club' | 'dm';
    id: string;
    name: string;
    avatar?: string;
  } | null;
  club?: Club;
  messages: any[];
  onSendMessage: (message: string, chatId: string, type: 'club' | 'dm') => Promise<void>;
  onDeleteMessage?: (messageId: string) => Promise<void>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  onBack: () => void;
}

const UnifiedChatContent: React.FC<UnifiedChatContentProps> = ({
  selectedChat,
  club,
  messages,
  onSendMessage,
  onDeleteMessage,
  onSelectUser,
  onBack
}) => {
  const { currentUser } = useApp();
  const { navigateToClubDetail, navigateToUserProfile } = useNavigation();
  const { markDirectMessagesAsRead, markClubMessagesAsRead, flushReadStatus } = useMessageReadStatus();
  const [isSending, setIsSending] = useState(false);

  // Mark conversation as active and set up read status handlers
  useEffect(() => {
    if (selectedChat) {
      console.log(`[UnifiedChatContent] Conversation opened: ${selectedChat.type} ${selectedChat.id}`);
      
      // 1. Mark as active immediately
      setActiveConversation(selectedChat.type, selectedChat.id);
      
      // 2. Reset badge for this conversation
      resetConversationBadge(selectedChat.id);
      
      // 3. Dispatch specific event when a club is selected to ensure real-time updates
      if (selectedChat.type === 'club') {
        window.dispatchEvent(new CustomEvent('clubSelected', {
          detail: { clubId: selectedChat.id }
        }));
      }
      
      // 4. Mark messages as read immediately to update badge
      const markAsRead = async () => {
        try {
          if (selectedChat.type === 'club') {
            await markClubMessagesAsRead(selectedChat.id, true); // Use immediate=true to flush the update
          } else if (selectedChat.type === 'dm') {
            await markDirectMessagesAsRead(selectedChat.id, true); // Use immediate=true to flush the update
          }
          
          // Force flush any debounced operations to ensure immediate update
          flushReadStatus();
          
          // Trigger event for UI components to refresh
          window.dispatchEvent(new CustomEvent('unreadMessagesUpdated'));
        } catch (error) {
          console.error('[UnifiedChatContent] Error marking messages as read:', error);
        }
      };
      
      // Execute immediately and also after a short delay to catch any race conditions
      markAsRead();
      
      const markAsReadTimer = setTimeout(markAsRead, 500);
      
      return () => {
        clearTimeout(markAsReadTimer);
        clearActiveConversation();
      };
    }
  }, [selectedChat, markClubMessagesAsRead, markDirectMessagesAsRead, flushReadStatus]);

  const handleSendMessage = async (message: string) => {
    if (!selectedChat) return;
    
    setIsSending(true);
    try {
      await onSendMessage(message, selectedChat.id, selectedChat.type);
      
      // Mark as read after sending to ensure badge updates correctly
      if (selectedChat.type === 'club') {
        await markClubMessagesAsRead(selectedChat.id, true);
      } else {
        await markDirectMessagesAsRead(selectedChat.id, true);
      }
      
      // Trigger event for UI components to refresh
      window.dispatchEvent(new CustomEvent('message-sent', { 
        detail: { type: selectedChat.type, id: selectedChat.id }
      }));
    } catch (error) {
      console.error('[UnifiedChatContent] Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleHeaderClick = () => {
    if (selectedChat?.type === 'club' && club) {
      navigateToClubDetail(club.id, club);
    } else if (selectedChat?.type === 'dm') {
      // For direct messages, we need to find the other user's ID
      const otherUserId = selectedChat.id.split('_').find(id => id !== currentUser?.id);
      if (otherUserId) {
        navigateToUserProfile(otherUserId, selectedChat.name, selectedChat.avatar);
      }
    }
  };

  // Get the appropriate members list based on chat type
  const getMembers = () => {
    if (selectedChat?.type === 'club' && club) {
      return club.members || [];
    } else if (selectedChat?.type === 'dm') {
      return currentUser ? [currentUser] : [];
    }
    return [];
  };

  if (!selectedChat) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-3 flex items-center">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div 
          onClick={handleHeaderClick} 
          className="flex-1 flex justify-center items-center gap-2 cursor-pointer hover:text-primary transition-colors px-0 mx-auto"
        >
          <UserAvatar name={selectedChat.name} image={selectedChat.avatar} size="sm" />
          <h3 className="font-semibold">{selectedChat.name}</h3>
        </div>
        <div className="w-9"></div>
      </div>
      
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0">
          <ChatMessages
            messages={messages}
            clubMembers={getMembers()}
            onDeleteMessage={onDeleteMessage}
            onSelectUser={onSelectUser}
          />
        </div>
        
        <div className="sticky bottom-0 left-0 right-0 bg-white">
          <ChatInput
            onSendMessage={handleSendMessage}
            conversationType={selectedChat.type}
            conversationId={selectedChat.id}
            isSending={isSending}
          />
        </div>
      </div>
    </div>
  );
};

export default UnifiedChatContent;
