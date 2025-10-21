
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { JoinRequest, Club, ClubMember } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useApp } from '@/context/AppContext';
import { acceptJoinRequest, denyJoinRequest } from '@/utils/joinRequestUtils';

export const useJoinRequests = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const { setSelectedClub, currentUser, refreshCurrentUser } = useApp();

  // Listen for the userDataUpdated event to refresh data
  useEffect(() => {
    const handleUserDataUpdate = () => {
      console.log('[useJoinRequests] User data update detected, refreshing user data');
      if (refreshCurrentUser) {
        refreshCurrentUser().catch(err => {
          console.error('[useJoinRequests] Error refreshing user data:', err);
        });
      }
    };

    window.addEventListener('userDataUpdated', handleUserDataUpdate);
    
    return () => {
      window.removeEventListener('userDataUpdated', handleUserDataUpdate);
    };
  }, [refreshCurrentUser]);

  const handleAcceptRequest = async (request: JoinRequest, club: Club) => {
    setProcessingRequests(prev => ({ ...prev, [request.id]: true }));
    
    try {
      setError(null);
      
      console.log('[useJoinRequests] Accepting request:', request.id);

      // Use the shared utility function to accept the request
      const success = await acceptJoinRequest(request.userId, request.clubId, request.userName);

      if (!success) {
        throw new Error("Failed to accept request");
      }
      
      // Fetch the user's details to create a member object
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, avatar')
        .eq('id', request.userId)
        .single();

      if (userError) {
        console.error('[useJoinRequests] Error fetching user data:', userError);
        throw userError;
      }

      // Create the new club member
      const newMember: ClubMember = {
        id: request.userId,
        name: userData.name || request.userName,
        avatar: userData.avatar || request.userAvatar,
        isAdmin: false,
        distanceContribution: 0
      };

      // Optimistically update the UI - remove the request
      setRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));

      // Create updated club object with the new member
      const updatedClub = {
        ...club,
        members: [...club.members, newMember]
      };

      // Update the club in the global context
      setSelectedClub(updatedClub);

      return updatedClub;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to accept request";
      setError(message);
      toast({
        title: "Error accepting request",
        description: message,
        variant: "destructive"
      });
      return null;
    } finally {
      setProcessingRequests(prev => ({ ...prev, [request.id]: false }));
    }
  };

  const handleDeclineRequest = async (request: JoinRequest) => {
    setProcessingRequests(prev => ({ ...prev, [request.id]: true }));
    
    try {
      setError(null);

      // Use the shared utility function to deny the request
      const success = await denyJoinRequest(request.userId, request.clubId);
      
      if (!success) {
        throw new Error("Failed to decline request");
      }

      // Optimistically update the UI
      setRequests(prevRequests => prevRequests.filter(r => r.id !== request.id));
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to decline request";
      setError(message);
      toast({
        title: "Error declining request",
        description: message,
        variant: "destructive"
      });
      return false;
    } finally {
      setProcessingRequests(prev => ({ ...prev, [request.id]: false }));
    }
  };

  const fetchClubRequests = useCallback(async (clubId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('[useJoinRequests] Fetching club requests for club:', clubId);
      
      // Query club_requests table directly, but only fetch pending requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('club_requests')
        .select('id, user_id, club_id, created_at, status')
        .eq('club_id', clubId)
        .eq('status', 'PENDING');

      if (requestsError) {
        console.error('[useJoinRequests] Error fetching club requests:', requestsError);
        throw requestsError;
      }

      console.log('[useJoinRequests] Found requests:', requestsData?.length || 0);

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return [];
      }

      // Now get user details for each request
      const formattedRequests: JoinRequest[] = [];
      
      for (const request of requestsData) {
        // Get user info separately
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name, avatar')
          .eq('id', request.user_id)
          .single();
          
        if (userError) {
          console.error('[useJoinRequests] Error fetching user data:', userError);
          // Add with default values if user data can't be fetched
          formattedRequests.push({
            id: request.id,
            userId: request.user_id,
            clubId: request.club_id,
            userName: 'Unknown User',
            userAvatar: '',
            createdAt: request.created_at,
            status: request.status
          });
        } else {
          formattedRequests.push({
            id: request.id,
            userId: request.user_id,
            clubId: request.club_id,
            userName: userData.name || 'Unknown',
            userAvatar: userData.avatar || '',
            createdAt: request.created_at,
            status: request.status
          });
        }
      }

      console.log('[useJoinRequests] Formatted requests:', formattedRequests);
      setRequests(formattedRequests);
      return formattedRequests;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch join requests";
      setError(message);
      console.error('[useJoinRequests] Error:', message);
      toast({
        title: "Error",
        description: "Could not load join requests",
        variant: "destructive"
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    requests,
    setRequests,
    fetchClubRequests,
    handleAcceptRequest,
    handleDeclineRequest,
    isProcessing: (requestId: string) => !!processingRequests[requestId]
  };
};
