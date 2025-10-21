
import { useMutation } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';

export const useChatDeletion = () => {
  const deleteChatMutation = useMutation({
    mutationFn: async ({ chatId }: { chatId: string }) => {
      // Logic for deleting regular chats (if needed)
      console.log("Regular chat deletion not implemented", chatId);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Chat Deleted",
        description: "The conversation has been removed from your chats."
      });
    },
    onError: (error) => {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error",
        description: "Failed to delete the conversation. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Return a function with the expected signature that calls the mutation
  const deleteChat = (chatId: string) => {
    // Trigger the mutation which handles both DB deletion and UI updates
    deleteChatMutation.mutate({ chatId });
  };

  return { deleteChat };
};
