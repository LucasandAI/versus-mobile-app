
import React, { useEffect } from 'react';
import { Club } from '@/types';
import MainChatDrawer from './drawer/MainChatDrawer';

interface ChatDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  onNewMessage?: (count: number) => void;
  clubMessages?: Record<string, any[]>;
  setClubMessages?: React.Dispatch<React.SetStateAction<Record<string, any[]>>>; 
  onSendMessage?: (message: string, clubId?: string) => Promise<void> | void;
}

const ChatDrawer: React.FC<ChatDrawerProps> = (props) => {
  // Debug: Check clubs IDs when they're passed to the drawer
  useEffect(() => {
    if (props.clubs?.length > 0) {
      console.log('[ChatDrawer] Clubs passed to drawer:');
      props.clubs.forEach(club => {
        console.log(`  Club: ${club.name}, ID: ${club.id} (type: ${typeof club.id})`);
      });
    }
  }, [props.clubs]);

  return <MainChatDrawer {...props} />;
};

export default ChatDrawer;
