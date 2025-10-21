
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useConversationManagement = (currentUserId: string | undefined, userId: string) => {
  const createConversation = async (): Promise<string | null> => {
    if (!currentUserId || !userId) return null;
    
    try {
      console.log('Checking for existing conversation between', currentUserId, 'and', userId);
      
      // Check if conversation already exists between these two users
      const { data: existingConversation, error: checkError } = await supabase
        .from('direct_conversations')
        .select('id')
        .or(`and(user1_id.eq.${currentUserId},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${currentUserId})`)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking for existing conversation:', checkError);
        throw checkError;
      }
      
      // If conversation exists, return its ID
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation.id);
        return existingConversation.id;
      }
      
      console.log('Creating new conversation between', currentUserId, 'and', userId);
      // Create a new conversation
      const { data: newConversation, error } = await supabase
        .from('direct_conversations')
        .insert({
          user1_id: currentUserId,
          user2_id: userId
        })
        .select('id')
        .single();
        
      if (error) {
        console.error('Error creating conversation:', error);
        throw error;
      }
      
      console.log('Created new conversation with ID:', newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Could not create conversation",
        variant: "destructive"
      });
      return null;
    }
  };

  return { createConversation };
};
