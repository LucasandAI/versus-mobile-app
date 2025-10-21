
import { Club } from './index';

export interface ChatMessage {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  isSupport?: boolean;
  optimistic?: boolean;
  isUserMessage?: boolean;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  timestamp: string;
}

export interface ChatState {
  messages: Record<string, ChatMessage[]>;
  unreadMessages: Record<string, number>;
}

// Adding SupportTicket type definition as a temporary solution
// This will be removed in future refactoring
export interface SupportTicket {
  id: string;
  subject: string;
  createdAt: string;
  messages: ChatMessage[];
}

// Adding a type definition for the sender in chat messages to include avatar
export interface MessageSender {
  id: string;
  name: string;
  avatar?: string;
}
