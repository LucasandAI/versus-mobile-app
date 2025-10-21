
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ClubRequest } from '@/types';

export const useClubRequests = (clubId: string) => {
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<ClubRequest[]>([]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_requests')
        .select(`
          id,
          user_id,
          club_id,
          created_at,
          users:user_id (
            name,
            avatar
          )
        `)
        .eq('club_id', clubId);

      if (error) throw error;

      setRequests(data.map(request => ({
        id: request.id,
        userId: request.user_id,
        clubId: request.club_id,
        createdAt: request.created_at
      })));
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Could not load join requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('club_requests')
        .insert([
          { user_id: userId, club_id: clubId }
        ]);

      if (error) throw error;

      toast({
        title: "Request sent",
        description: "Your request to join has been sent to the club admins"
      });
    } catch (error) {
      console.error('Error sending request:', error);
      toast({
        title: "Error",
        description: "Could not send join request",
        variant: "destructive"
      });
    }
  };

  return {
    requests,
    loading,
    fetchRequests,
    handleRequest
  };
};
