
import React, { useState, useEffect } from 'react';
import { UserPlus, X, Loader2 } from 'lucide-react';
import Button from '../shared/Button';
import { formatLeagueWithTier } from '@/lib/format';
import UserAvatar from '../shared/UserAvatar';
import { Division } from '@/types';
import { useNavigation } from '@/hooks/useNavigation';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface AvailableClub {
  id: string;
  name: string;
  division: Division;
  tier: number;
  members: number;
  logo?: string;
}

interface AvailableClubsProps {
  clubs: AvailableClub[];
  onRequestJoin: (clubId: string, clubName: string) => void;
}

const AvailableClubs: React.FC<AvailableClubsProps> = ({ clubs, onRequestJoin }) => {
  const { navigateToClubDetail } = useNavigation();
  const { currentUser } = useApp();
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});
  const [processingRequests, setProcessingRequests] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Initialize member counts from the clubs prop
    const initialCounts: Record<string, number> = {};
    clubs.forEach(club => {
      initialCounts[club.id] = club.members;
    });
    setMemberCounts(initialCounts);
  }, [clubs]);

  useEffect(() => {
    if (currentUser) {
      fetchPendingRequests();
    }
    
    // Set up Supabase realtime subscription for club_members table
    const clubMembershipChannel = supabase
      .channel('available-clubs-membership-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members'
        },
        async () => {
          console.log('[AvailableClubs] Realtime update detected for club members, refreshing member counts');
          await fetchLatestMemberCounts();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(clubMembershipChannel);
    };
  }, [currentUser, clubs]);
  
  // Handler for the clubMembershipChanged event
  useEffect(() => {
    const handleClubMembershipChange = async () => {
      console.log('[AvailableClubs] clubMembershipChanged event received, refreshing member counts');
      await fetchLatestMemberCounts();
    };
    
    window.addEventListener('clubMembershipChanged', handleClubMembershipChange);
    window.addEventListener('userDataUpdated', handleClubMembershipChange);
    
    return () => {
      window.removeEventListener('clubMembershipChanged', handleClubMembershipChange);
      window.removeEventListener('userDataUpdated', handleClubMembershipChange);
    };
  }, [clubs]);

  const fetchLatestMemberCounts = async () => {
    if (!clubs.length) return;
    
    try {
      const clubIds = clubs.map(club => club.id);
      const { data, error } = await supabase
        .from('clubs')
        .select('id, member_count')
        .in('id', clubIds);
        
      if (error) {
        console.error('[AvailableClubs] Error fetching member counts:', error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        const newCounts: Record<string, number> = {};
        data.forEach(club => {
          newCounts[club.id] = club.member_count;
        });
        
        setMemberCounts(prev => ({
          ...prev,
          ...newCounts
        }));
        
        console.log('[AvailableClubs] Updated member counts:', newCounts);
      }
    } catch (err) {
      console.error('[AvailableClubs] Error fetching member counts:', err);
    }
  };

  const fetchPendingRequests = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('club_requests')
        .select('club_id')
        .eq('user_id', currentUser.id)
        .eq('status', 'PENDING');
        
      if (error) {
        console.error('Error fetching pending requests:', error);
        return;
      }

      // Initialize an empty object to store pending requests
      const requests: Record<string, boolean> = {};
      
      // Check if data exists and is an array before using forEach
      if (data && Array.isArray(data)) {
        data.forEach(request => {
          requests[request.club_id] = true;
        });
      }
      
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error processing pending requests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkExistingRequest = async (clubId: string) => {
    const { data, error } = await supabase
      .from('club_requests')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', currentUser?.id)
      .eq('status', 'PENDING') // Updated from 'pending' to 'PENDING'
      .single();
      
    if (error) {
      console.error('Error checking existing request:', error);
      return false;
    }
    
    return data !== null;
  };

  const handleClubClick = (club: AvailableClub) => {
    navigateToClubDetail(club.id, {
      id: club.id,
      name: club.name,
      division: club.division,
      tier: club.tier,
      logo: club.logo || '/placeholder.svg',
    });
  };

  const handleRequestClick = async (e: React.MouseEvent, clubId: string, clubName: string) => {
    e.stopPropagation();
    
    // Prevent double clicks and rapid toggling
    if (processingRequests[clubId]) return;
    
    // Set processing state for this specific club
    setProcessingRequests(prev => ({
      ...prev,
      [clubId]: true
    }));
    
    // Update local state optimistically
    const isCurrentlyPending = pendingRequests[clubId];
    setPendingRequests(prev => ({
      ...prev,
      [clubId]: !isCurrentlyPending
    }));
    
    // Call the parent handler
    await onRequestJoin(clubId, clubName);
    
    // Add a small delay to prevent button flickering
    setTimeout(() => {
      setProcessingRequests(prev => ({
        ...prev,
        [clubId]: false
      }));
    }, 500);
  };

  if (clubs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <p className="text-gray-500 text-center py-4">
          No clubs available to join at the moment
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <p className="text-gray-500 text-sm mb-4">
        Clubs looking for members
      </p>

      <div className="space-y-3">
        {clubs.map((club) => {
          // Use the updated member count from our state, or fall back to the prop value
          const currentMemberCount = memberCounts[club.id] !== undefined ? memberCounts[club.id] : club.members;
          const isProcessing = processingRequests[club.id] || false;
          
          return (
            <div 
              key={club.id} 
              className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0"
            >
              <div 
                className="flex items-center gap-3 cursor-pointer hover:text-primary"
                onClick={() => handleClubClick(club)}
              >
                <UserAvatar
                  name={club.name}
                  image={club.logo}
                  size="sm"
                  className="h-10 w-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClubClick(club);
                  }}
                />
                <div>
                  <h3 className="font-medium text-sm">{club.name}</h3>
                  <span className="text-xs text-gray-500">
                    {formatLeagueWithTier(club.division, club.tier)} • {currentMemberCount}/5 members
                  </span>
                </div>
              </div>
              <Button 
                variant={pendingRequests[club.id] ? "outline" : "outline"}
                size="sm" 
                className={`h-8 ${pendingRequests[club.id] ? "text-red-500 hover:text-red-700" : ""}`}
                icon={isProcessing ? 
                  <Loader2 className="h-4 w-4 animate-spin" /> : 
                  pendingRequests[club.id] ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />
                }
                onClick={(e) => handleRequestClick(e, club.id, club.name)}
                loading={isProcessing}
                disabled={isProcessing}
              >
                {pendingRequests[club.id] ? "Cancel Request" : "Request"}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AvailableClubs;
