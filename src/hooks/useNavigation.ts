
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useUserNavigation } from './navigation/useUserNavigation';
import { useClubNavigation } from './navigation/useClubNavigation';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useNavigation = () => {
  const { navigateToUserProfile, isLoading: userNavLoading } = useUserNavigation();
  const { navigateToClub } = useClubNavigation();
  const { currentUser, setCurrentView, setSelectedUser, setSelectedClub } = useApp();
  
  const navigateToClubDetail = async (clubId: string, clubData?: Partial<Club>) => {
    if (!clubId) {
      console.error('[useNavigation] Cannot navigate to club detail, missing club ID');
      return;
    }
    
    console.log('[useNavigation] Navigating to club detail:', clubId, clubData);
    
    // Set a temporary club object while we load the full data
    const tempClub: Partial<Club> = {
      id: clubId,
      name: clubData?.name || 'Loading...',
      logo: clubData?.logo || '/placeholder.svg',
      division: clubData?.division || 'bronze',
      tier: clubData?.tier || 5,
      elitePoints: clubData?.elitePoints || 0,
      members: [],
      matchHistory: []
    };
    
    setSelectedClub(tempClub as Club);
    setCurrentView('clubDetail');
    
    try {
      // Always fetch fresh club details
      const { data: clubDetails, error: clubError } = await supabase
        .from('clubs')
        .select('id, name, logo, division, tier, elite_points, bio, created_by')
        .eq('id', clubId)
        .single();
      
      if (clubError) {
        console.error('[useNavigation] Error fetching club details:', clubError);
        return;
      }
      
      // Always fetch fresh member data
      const { data: membersData, error: membersError } = await supabase
        .from('club_members')
        .select('user_id, is_admin')
        .eq('club_id', clubId);
      
      if (membersError) {
        console.error('[useNavigation] Error fetching club members:', membersError);
      }
      
      let members: any[] = [];
      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, avatar')
          .in('id', userIds);
          
        if (usersData) {
          members = usersData.map(user => {
            const memberData = membersData.find(m => m.user_id === user.id);
            return {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              isAdmin: memberData?.is_admin || false,
              distanceContribution: 0
            };
          });
        }
      }
      
      // Fetch match history
      const { data: matchesData } = await supabase
        .from('matches')
        .select('*')
        .or(`home_club_id.eq.${clubId},away_club_id.eq.${clubId}`)
        .order('end_date', { ascending: false });
      
      const matchHistory = matchesData ? matchesData.map(match => {
        return {
          id: match.id,
          homeClub: {
            id: match.home_club_id,
            name: 'Home Club',
            logo: '/placeholder.svg',
            totalDistance: 0,
            members: []
          },
          awayClub: {
            id: match.away_club_id,
            name: 'Away Club',
            logo: '/placeholder.svg',
            totalDistance: 0,
            members: []
          },
          startDate: match.start_date,
          endDate: match.end_date,
          status: match.status as 'active' | 'completed',
          winner: match.winner as 'home' | 'away' | 'draw' | undefined
        };
      }) : [];
      
      const fullClub: Club = {
        id: clubDetails.id,
        name: clubDetails.name || 'Unnamed Club',
        logo: clubDetails.logo || '/placeholder.svg',
        division: ensureDivision(clubDetails.division),
        tier: clubDetails.tier || 5,
        elitePoints: clubDetails.elite_points || 0,
        bio: clubDetails.bio || '',
        members: members,
        matchHistory: matchHistory,
        currentMatch: matchHistory.find(m => m.status === 'active') || null
      };
      
      console.log('[useNavigation] Successfully fetched full club data:', fullClub);
      
      setSelectedClub(fullClub);
      
    } catch (error) {
      console.error('[useNavigation] Error during club data fetching:', error);
    }
  };
  
  const navigateToOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };
  
  return {
    navigateToUserProfile,
    navigateToClubDetail,
    navigateToClub,
    navigateToOwnProfile,
    isLoading: userNavLoading || false
  };
};
