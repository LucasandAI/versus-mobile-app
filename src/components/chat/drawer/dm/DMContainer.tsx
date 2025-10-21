
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { useUnreadMessages } from '@/context/unread-messages';
import DMConversationList from './DMConversationList';
import DMConversation from './DMConversation';
import DMSearchPanel from './DMSearchPanel';

export type DMContainerProps = {
  directMessageUser: {
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null;
  setDirectMessageUser: React.Dispatch<React.SetStateAction<{
    userId: string;
    userName: string;
    userAvatar: string;
    conversationId: string;
  } | null>>;
  unreadConversations?: Set<string>;
};

const DMContainer: React.FC<DMContainerProps> = ({ 
  directMessageUser, 
  setDirectMessageUser,
  unreadConversations = new Set<string>()
}) => {
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    name: string;
    avatar?: string;
    conversationId: string;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { currentUser } = useApp();
  const navigate = useNavigate();
  const { conversations, getOrCreateConversation } = useDirectConversationsContext();
  const { unreadConversations: contextUnreadConversations } = useUnreadMessages();

  // Use provided unreadConversations or fall back to context
  const effectiveUnreadConversations = unreadConversations.size > 0 
    ? unreadConversations 
    : contextUnreadConversations;

  const handleUserSelect = async (userId: string, userName: string, userAvatar?: string, conversationId?: string) => {
    if (userId === currentUser?.id) {
      // Navigate to the user's own profile
      navigate(`/profile/${userId}`);
      return;
    }

    if (conversationId) {
      setSelectedUser({
        id: userId,
        name: userName,
        avatar: userAvatar,
        conversationId
      });
    } else {
      const conversation = await getOrCreateConversation(userId, userName, userAvatar);
      if (conversation) {
        setSelectedUser({
          id: userId,
          name: userName,
          avatar: userAvatar,
          conversationId: conversation.conversationId
        });
      }
    }
  };

  // If there's only a single conversation and no selected user, autoselect it
  useEffect(() => {
    if (!selectedUser && conversations.length === 1 && !isSearching) {
      const conversation = conversations[0];
      setSelectedUser({
        id: conversation.userId,
        name: conversation.userName,
        avatar: conversation.userAvatar,
        conversationId: conversation.conversationId
      });
    }
  }, [conversations, selectedUser, isSearching]);

  return (
    <div className="flex flex-col h-full relative">
      {selectedUser ? (
        <DMConversation
          user={{
            id: selectedUser.id,
            name: selectedUser.name,
            avatar: selectedUser.avatar || ''
          }}
          conversationId={selectedUser.conversationId}
          onBack={() => setSelectedUser(null)}
        />
      ) : isSearching ? (
        <DMSearchPanel
          onSelect={(userId, userName, userAvatar) => 
            handleUserSelect(userId, userName, userAvatar)
          }
          onBack={() => setIsSearching(false)}
        />
      ) : (
        <DMConversationList
          conversations={conversations}
          onConversationSelect={(userId, userName, userAvatar, conversationId) => 
            handleUserSelect(userId, userName, userAvatar, conversationId)
          }
          onNewChat={() => setIsSearching(true)}
          unreadConversations={effectiveUnreadConversations}
          selectedUserId={selectedUser?.id || ''}
        />
      )}
    </div>
  );
};

export default DMContainer;
