
import { useApp } from '@/context/AppContext';
import { Club, Division } from '@/types';
import { generateMatchHistoryFromDivision } from '@/utils/club/matchHistoryUtils';
import { getClubToJoin } from '@/utils/club';
import { supabase } from '@/integrations/supabase/client';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useClubNavigation = () => {
  const { setCurrentView, setSelectedClub, currentUser, refreshCurrentUser } = useApp();

  const navigateToClub = async (club: Partial<Club>) => {
    console.log('[useClubNavigation] Navigating to club:', club.id, club.name);
    
    // Check if it's one of the user's clubs first
    const userClub = currentUser?.clubs.find(c => c.id === club.id);
    
    if (userClub) {
      console.log('[useClubNavigation] Found club in user clubs:', userClub);
      setSelectedClub(userClub);
      setCurrentView('clubDetail');
      return;
    }

    // If not found in local data, try to fetch fresh club data from database
    // This handles the case where user was just added to a club but local data hasn't refreshed yet
    if (club.id && refreshCurrentUser) {
      console.log('[useClubNavigation] Club not found locally, refreshing user data...');
      try {
        const refreshedUser = await refreshCurrentUser();
        const refreshedUserClub = refreshedUser?.clubs.find(c => c.id === club.id);
        
        if (refreshedUserClub) {
          console.log('[useClubNavigation] Found club after refresh:', refreshedUserClub);
          setSelectedClub(refreshedUserClub);
          setCurrentView('clubDetail');
          return;
        }
      } catch (error) {
        console.error('[useClubNavigation] Error refreshing user data:', error);
      }
    }

    // For non-member clubs, fetch complete club data from database instead of creating preview
    if (club.id) {
      console.log('[useClubNavigation] Fetching complete club data for non-member club:', club.id);
      try {
        // Fetch complete club data including members
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select(`
            id,
            name,
            logo,
            division,
            tier,
            elite_points,
            bio,
            member_count
          `)
          .eq('id', club.id)
          .single();

        if (clubError) {
          console.error('[useClubNavigation] Error fetching club data:', clubError);
          throw clubError;
        }

        // Fetch club members
        const { data: membersData, error: membersError } = await supabase
          .from('club_members')
          .select(`
            user_id,
            is_admin,
            users:user_id (
              id,
              name,
              avatar
            )
          `)
          .eq('club_id', club.id);

        if (membersError) {
          console.error('[useClubNavigation] Error fetching members:', membersError);
          // Continue with empty members array rather than failing
        }

        // Create club object with real data
        const completeClub: Club = {
          id: clubData.id,
          name: clubData.name,
          logo: clubData.logo || '/placeholder.svg',
          division: ensureDivision(clubData.division),
          tier: clubData.tier || 5,
          elitePoints: clubData.elite_points || 0,
          bio: clubData.bio || `Welcome to this running club! We're a group of passionate runners looking to challenge ourselves and improve together.`,
          members: membersData?.map(member => ({
            id: member.users?.id || '',
            name: member.users?.name || 'Unknown Member',
            avatar: member.users?.avatar || '/placeholder.svg',
            isAdmin: member.is_admin,
            distanceContribution: 0
          })) || [],
          matchHistory: [], // Will be loaded by club detail if needed
          currentMatch: null,
          joinRequests: [],
          isPreviewClub: false
        };

        console.log('[useClubNavigation] Complete club data fetched:', completeClub);
        setSelectedClub(completeClub);
        setCurrentView('clubDetail');
        return;

      } catch (error) {
        console.error('[useClubNavigation] Error fetching complete club data:', error);
        // Fall back to preview club if fetching fails
      }
    }

    // Fallback: For non-member clubs, get or create a complete club object (preview mode)
    const clubToJoin = getClubToJoin(
      club.id || '', 
      club.name || '', 
      currentUser?.clubs || []
    );

    // Ensure the club has match history
    if (!clubToJoin.matchHistory || clubToJoin.matchHistory.length === 0) {
      clubToJoin.matchHistory = generateMatchHistoryFromDivision(clubToJoin);
    }

    console.log("Navigating to preview club:", clubToJoin);
    setSelectedClub(clubToJoin);
    setCurrentView('clubDetail');
  };

  return { navigateToClub };
};
