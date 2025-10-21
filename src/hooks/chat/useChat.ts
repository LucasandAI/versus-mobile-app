
import { useChatState } from './useChatState';

export const useChat = (open: boolean, onNewMessage?: (count: number) => void) => {
  return useChatState(open, onNewMessage);
};

export type ChatHookReturn = ReturnType<typeof useChat>;
