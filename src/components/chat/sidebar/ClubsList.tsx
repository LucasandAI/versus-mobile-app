
import React, { useEffect, useState } from 'react';
import { Club } from '@/types';
import UserAvatar from '../../shared/UserAvatar';
import ClubMembersPopover from './ClubMembersPopover';
import { useNavigation } from '@/hooks/useNavigation';
import { formatDistanceToNow } from 'date-fns';
import { useUnreadMessages } from '@/context/unread-messages';
import { Badge } from '@/components/ui/badge';
import { ClubConversation } from '@/hooks/chat/messages/useClubConversations';

interface ClubsListProps {
  clubConversations: ClubConversation[];
  selectedClub: Club | null;
  onSelectClub: (club: Club) => void;
  unreadCounts: Record<string, number>;
  unreadClubs?: Set<string>;
  onSelectUser: (userId: string, userName: string, userAvatar?: string) => void;
  setChatToDelete: (data: {
    id: string;
    name: string;
    isTicket?: boolean;
  } | null) => void;
}

const ClubsList: React.FC<ClubsListProps> = ({
  clubConversations,
  selectedClub,
  onSelectClub,
  onSelectUser,
  unreadClubs: propUnreadClubs,
  setChatToDelete,
  unreadCounts,
}) => {
  const { navigateToClubDetail } = useNavigation();
  const { unreadClubs: contextUnreadClubs, markClubMessagesAsRead } = useUnreadMessages();
  const unreadClubs = propUnreadClubs || contextUnreadClubs;
  const [updateKey, setUpdateKey] = useState(Date.now());

  // Force re-render when conversations change or when messages are updated
  useEffect(() => {
    setUpdateKey(Date.now());
    console.log('[ClubsList] Re-rendering with conversations:', clubConversations.length);
  }, [clubConversations]);
  
  // Listen for clubMessagesUpdated events
  useEffect(() => {
    const handleMessagesUpdated = () => {
      console.log('[ClubsList] Message update detected, forcing re-render');
      setUpdateKey(Date.now());
    };
    
    window.addEventListener('clubMessagesUpdated', handleMessagesUpdated);
    return () => {
      window.removeEventListener('clubMessagesUpdated', handleMessagesUpdated);
    };
  }, []);

  useEffect(() => {
    console.log('[ClubsList] unreadClubs set updated:', Array.from(unreadClubs));
    console.log('[ClubsList] Using prop unread clubs?', !!propUnreadClubs);
  }, [unreadClubs, propUnreadClubs]);

  const handleClubClick = (club: Club, e: React.MouseEvent) => {
    e.preventDefault();
    onSelectClub(club);
    markClubMessagesAsRead(club.id);
    console.log('[ClubsList] Club selected for chat:', club.id);
  };

  const truncateMessage = (text: string) => {
    return text?.length > 50 ? `${text.substring(0, 50)}...` : text;
  };

  const unreadKey = Array.from(unreadClubs).join(',');

  return (
    <div className="p-3" key={`clubs-list-${updateKey}-${unreadKey}`}>
      <h1 className="text-4xl font-bold mb-4">Clubs</h1>
      <div className="divide-y">
        {clubConversations.map(({ club, lastMessage }) => {
          const clubId = String(club.id);
          const isUnread = unreadClubs.has(clubId);
          const formattedTime = lastMessage?.timestamp
            ? formatDistanceToNow(new Date(lastMessage.timestamp), { addSuffix: false })
            : '';
          return (
            <div
              key={`${club.id}-${isUnread ? 'unread' : 'read'}-${lastMessage?.timestamp || 'no-msg'}-${updateKey}`}
              className={`flex items-start px-4 py-3 cursor-pointer hover:bg-gray-50 relative group
                ${selectedClub?.id === club.id ? 'bg-primary/10 text-primary' : ''}
                ${isUnread ? 'font-medium' : ''}`}
              onClick={(e) => handleClubClick(club, e)}
            >
              <UserAvatar
                name={club.name}
                image={club.logo || ''}
                size="lg"
                className="flex-shrink-0 mr-3"
              />
              <div className="flex-1 min-w-0 overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <h2 className={`text-lg truncate max-w-[60%] ${isUnread ? 'font-bold' : 'font-medium'}`}>{club.name}</h2>
                  {formattedTime && (
                    <span className={`text-xs ${isUnread ? 'font-bold' : 'text-gray-500'} flex-shrink-0 ml-auto`}>
                      {formattedTime}
                    </span>
                  )}
                </div>
                <div className="flex items-center">
                  <p className={`text-sm truncate flex-1 ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                    {lastMessage ? (
                      <>
                        <span className={isUnread ? 'font-bold' : 'font-medium'}>
                          {lastMessage.sender_username || 'Unknown'}:
                        </span>{' '}
                        {truncateMessage(lastMessage.message)}
                      </>
                    ) : (
                      "No messages yet"
                    )}
                  </p>
                  {isUnread && <Badge variant="dot" className="ml-2" />}
                </div>
                <ClubMembersPopover club={club} onSelectUser={onSelectUser} />
              </div>
            </div>
          );
        })}
        {clubConversations.length === 0 && (
          <div className="text-center py-4 text-sm text-gray-500">
            You don't have any clubs yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsList;
