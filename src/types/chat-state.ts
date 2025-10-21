
import { ChatMessage } from './chat';

export interface ChatStateData {
  messages: Record<string, ChatMessage[]>;
  unreadMessages: Record<string, number>;
}

export interface ChatActions {
  handleNewMessage: (clubId: string, message: ChatMessage, isOpen: boolean) => void;
  markMessagesAsRead: (clubId: string) => void;
  deleteChat: (chatId: string) => void;
}

