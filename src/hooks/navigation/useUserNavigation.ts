
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { User, Club } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { UserNavigationResult } from './types';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useUserNavigation = (): UserNavigationResult => {
  const { setCurrentView, setSelectedUser } = useApp();
  const [isLoading, setIsLoading] = useState(false);

  const navigateToUserProfile = async (userId: string, userName: string, userAvatar: string = '/placeholder.svg') => {
    setIsLoading(true);
    
    try {
      // Create a temporary user object with basic info while we load data
      const tempUser: User = {
        id: userId,
        name: userName,
        avatar: userAvatar,
        clubs: []
      };
      
      setSelectedUser(tempUser);
      setCurrentView('profile');
      
      // Fetch user data and club memberships in parallel
      const [userResponse, membershipResponse] = await Promise.all([
        supabase
          .from('users')
          .select('id, name, avatar, bio, instagram, twitter, facebook, linkedin, website, tiktok')
          .eq('id', userId)
          .single(),
        
        supabase
          .from('club_members')
          .select(`
            club_id,
            is_admin,
            clubs (
              id,
              name,
              logo,
              division,
              tier,
              elite_points,
              bio
            )
          `)
          .eq('user_id', userId)
      ]);
      
      const userData = userResponse.data;
      const userError = userResponse.error;
      const memberships = membershipResponse.data;
      const clubsError = membershipResponse.error;
        
      if (userError || !userData) {
        console.error('Error fetching user profile:', userError);
        return;
      }
      
      if (clubsError) {
        console.error('Error fetching user clubs:', clubsError);
      }
      
      const clubs: Club[] = [];
      
      if (memberships && memberships.length > 0) {
        for (const membership of memberships) {
          if (!membership.clubs) continue;
          
          // Transform data
          const club = membership.clubs;
          const divisionValue = ensureDivision(club.division);
          
          clubs.push({
            id: club.id,
            name: club.name,
            logo: club.logo || '/placeholder.svg',
            division: divisionValue,
            tier: club.tier || 1,
            elitePoints: club.elite_points || 0,
            bio: club.bio,
            members: [], // Will be populated if needed
            matchHistory: []
          });
        }
      }
      
      // Update the selected user with the fetched data
      setSelectedUser({
        id: userData.id,
        name: userData.name || userName,
        avatar: userData.avatar || userAvatar,
        bio: userData.bio,
        instagram: userData.instagram,
        twitter: userData.twitter,
        facebook: userData.facebook,
        linkedin: userData.linkedin,
        website: userData.website,
        tiktok: userData.tiktok,
        clubs: clubs
      });
      
    } catch (error) {
      console.error('Error in navigateToUserProfile:', error);
      toast({
        title: "Error loading profile",
        description: "Could not load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    navigateToUserProfile,
    isLoading
  };
};
