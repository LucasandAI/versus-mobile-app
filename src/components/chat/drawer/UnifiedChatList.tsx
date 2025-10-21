import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useDirectConversationsContext } from '@/context/DirectConversationsContext';
import { useUnreadMessages } from '@/context/unread-messages';
import { useClubConversationList } from '@/hooks/chat/messages/useClubConversationList';
import UserAvatar from '@/components/shared/UserAvatar';
import { MessageSquare, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface UnifiedChatListProps {
  onSelectChat: (type: 'club' | 'dm', id: string, name: string, avatar?: string) => void;
  selectedChatId?: string;
  selectedChatType?: 'club' | 'dm';
}

const UnifiedChatList: React.FC<UnifiedChatListProps> = ({
  onSelectChat,
  selectedChatId,
  selectedChatType
}) => {
  const { currentUser } = useApp();
  const { conversations: directConversations = [], loading: loadingDMs, getOrCreateConversation } = useDirectConversationsContext();
  const { unreadClubs, unreadConversations } = useUnreadMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; avatar?: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [senderCache, setSenderCache] = useState<Record<string, {name: string, avatar?: string}>>({});

  const userClubs = currentUser?.clubs || [];
  const { conversations: clubConversations, isLoading: loadingClubs } = useClubConversationList(userClubs);

  // Combined loading state - show loading until BOTH club and DM data are ready
  const isLoading = loadingDMs || loadingClubs;
  const isEmpty = !isLoading && directConversations.length === 0 && userClubs.length === 0;

  // Pre-load sender details for club messages
  useEffect(() => {
    const loadSenderDetails = async () => {
      const senderIds = new Set<string>();
      
      clubConversations.forEach(conv => {
        if (conv.lastMessage?.sender_id && !senderCache[conv.lastMessage.sender_id]) {
          senderIds.add(conv.lastMessage.sender_id);
        }
      });
      
      if (senderIds.size === 0) return;
      
      try {
        const { data } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', Array.from(senderIds));
          
        if (data && data.length > 0) {
          const newCache = { ...senderCache };
          data.forEach(user => {
            newCache[user.id] = { name: user.name, avatar: user.avatar };
          });
          setSenderCache(newCache);
        }
      } catch (error) {
        console.error('[UnifiedChatList] Error loading sender details:', error);
      }
    };
    
    loadSenderDetails();
  }, [clubConversations]);
  
  const getSenderName = (senderId: string | undefined, fallbackName: string | undefined): string => {
    if (!senderId) return fallbackName || 'Unknown';
    if (senderId === currentUser?.id) return 'You';
    if (senderCache[senderId]) return senderCache[senderId].name;
    return fallbackName || 'Unknown';
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, avatar')
        .neq('id', currentUser?.id) // Exclude current user
        .ilike('name', `%${query}%`)
        .order('name');

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('[UnifiedChatList] Error searching users:', error);
      toast({
        title: "Error",
        description: "Failed to search users",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = async (user: { id: string; name: string; avatar?: string }) => {
    const conversation = await getOrCreateConversation(user.id, user.name, user.avatar);
    if (conversation) {
      onSelectChat('dm', conversation.conversationId, conversation.userName, conversation.userAvatar);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  // Wait until ALL data is fully loaded to prevent flash
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search Bar */}
      <div className="p-4 border-b">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search all users..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-[60vh] overflow-auto">
            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition-colors"
              >
                <UserAvatar name={user.name} image={user.avatar} size="sm" />
                <span className="font-medium">{user.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Club Chats Section - Already sorted with loading state handled */}
      {clubConversations.length > 0 && (
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-gray-500 px-4 py-2">Club Chats</h2>
          {clubConversations.map(({ club, lastMessage }) => {
            const isSelected = selectedChatType === 'club' && selectedChatId === club.id;
            const hasUnread = unreadClubs.has(club.id);
            const senderName = lastMessage?.sender_id ? 
                              getSenderName(lastMessage.sender_id, lastMessage.sender?.name) : 
                              'Unknown';
                              
            return (
              <button
                key={club.id}
                onClick={() => onSelectChat('club', club.id, club.name, club.logo)}
                className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                  isSelected ? 'bg-gray-100' : ''
                }`}
              >
                <UserAvatar
                  name={club.name}
                  image={club.logo}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">{club.name}</p>
                    {lastMessage?.timestamp && (
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-500 truncate">
                      {lastMessage && lastMessage.message ? (
                        <>
                          <span className="font-medium">
                            {senderName}:
                          </span>{' '}
                          {lastMessage.message}
                        </>
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                    {hasUnread && (
                      <span className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Direct Messages Section - Already sorted in context */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-500 px-4 py-2">Direct Messages</h2>
        {directConversations.map((conversation) => {
          const isSelected = selectedChatType === 'dm' && selectedChatId === conversation.conversationId;
          const hasUnread = unreadConversations.has(conversation.conversationId);

          return (
            <button
              key={conversation.conversationId}
              onClick={() => onSelectChat('dm', conversation.conversationId, conversation.userName, conversation.userAvatar)}
              className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors ${
                isSelected ? 'bg-gray-100' : ''
              }`}
            >
              <UserAvatar
                name={conversation.userName}
                image={conversation.userAvatar}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium truncate">{conversation.userName}</p>
                  {conversation.timestamp && (
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(conversation.timestamp)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-500 truncate">
                    {conversation.lastMessage ? conversation.lastMessage : "No messages yet"}
                  </p>
                  {hasUnread && (
                    <span className="ml-2 h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {isEmpty && !searchQuery && (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">No conversations yet</p>
        </div>
      )}
    </div>
  );
};

export default UnifiedChatList;
