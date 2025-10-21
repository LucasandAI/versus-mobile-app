
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { User, ClubMember } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';
import { toast } from '@/hooks/use-toast';

export const useLoadCurrentUser = () => {
  const loadCurrentUser = async (userId: string): Promise<User | null> => {
    try {
      console.log('[useLoadCurrentUser] Loading user data for ID:', userId);

      // First check if the user exists in the database
      const { data: userData, error: userError } = await safeSupabase
        .from('users')
        .select('id, name, avatar, bio, instagram, twitter, facebook, linkedin, website, tiktok')
        .eq('id', userId)
        .maybeSingle();

      console.log('[useLoadCurrentUser] User query response:', { 
        userData, 
        error: userError?.message, 
        hasUserData: !!userData 
      });

      // If there's an error or no user data, return a basic user profile without creating one
      if (userError || !userData) {
        console.warn('[useLoadCurrentUser] User not found in database, returning basic profile');
        
        // Return a basic user since we couldn't find one in the database
        const basicUser: User = {
          id: userId,
          name: 'User',
          avatar: '/placeholder.svg',
          bio: '',
          clubs: []
        };
        
        return basicUser;
      }

      // User exists, load their clubs
      let clubs = [];
      try {
        console.log('[useLoadCurrentUser] Fetching clubs for user:', userId);
        const { data: memberships, error: clubsError } = await safeSupabase
          .from('club_members')
          .select('club_id, is_admin')
          .eq('user_id', userId);

        console.log('[useLoadCurrentUser] Club memberships result:', { 
          membershipCount: memberships?.length || 0,
          error: clubsError?.message
        });

        if (clubsError) {
          console.error('[useLoadCurrentUser] Error fetching user clubs:', clubsError);
        } else if (memberships && memberships.length > 0) {
          // Process each club membership in parallel
          const clubPromises = memberships.map(async (membership) => {
            try {
              // Get club data
              const { data: club, error: clubError } = await safeSupabase
                .from('clubs')
                .select('id, name, logo, division, tier, elite_points, bio')
                .eq('id', membership.club_id)
                .single();
                
              if (clubError || !club) {
                console.error('[useLoadCurrentUser] Error fetching club details:', clubError);
                return null;
              }
              
              // Fetch club members for this club
              const { data: clubMembers, error: membersError } = await safeSupabase
                .from('club_members')
                .select(`
                  user_id, 
                  is_admin,
                  users (
                    id,
                    name,
                    avatar
                  )
                `)
                .eq('club_id', club.id);
              
              if (membersError) {
                console.error('[useLoadCurrentUser] Error fetching club members:', membersError);
              }
              
              // Transform club members into the expected format
              const members: ClubMember[] = clubMembers ? clubMembers.map(member => ({
                id: member.users.id,
                name: member.users.name,
                avatar: member.users.avatar || '/placeholder.svg',
                isAdmin: member.is_admin,
                distanceContribution: 0
              })) : [];
              
              console.log(`[useLoadCurrentUser] Club ${club.name} has ${members.length} members`);
                
              return {
                id: club.id,
                name: club.name,
                logo: club.logo || '/placeholder.svg',
                division: ensureDivision(club.division),
                tier: club.tier || 1,
                elitePoints: club.elite_points || 0,
                bio: club.bio || '',
                members: members,
                matchHistory: []
              };
            } catch (error) {
              console.error('[useLoadCurrentUser] Error processing club:', error);
              return null;
            }
          });
          
          // Wait for all club data to be processed
          clubs = (await Promise.all(clubPromises)).filter(Boolean);
        }
      } catch (clubsError) {
        console.error('[useLoadCurrentUser] Error in clubs loading:', clubsError);
      }

      // Construct the full user profile
      const userProfile: User = {
        id: userData.id,
        name: userData.name || 'User',
        avatar: userData.avatar || '/placeholder.svg',
        bio: userData.bio || '',
        instagram: userData.instagram || '',
        twitter: userData.twitter || '',
        facebook: userData.facebook || '',
        linkedin: userData.linkedin || '',
        website: userData.website || '',
        tiktok: userData.tiktok || '',
        clubs: clubs
      };

      console.log('[useLoadCurrentUser] Successfully built user profile with', clubs.length, 'clubs');
      return userProfile;
    } catch (error) {
      console.error('[useLoadCurrentUser] Error in loadCurrentUser:', error);
      
      // Return a basic user profile as fallback
      const basicUser: User = {
        id: userId,
        name: 'User',
        avatar: '/placeholder.svg',
        bio: '',
        clubs: []
      };
      
      return basicUser;
    }
  };
  
  return { loadCurrentUser };
};
