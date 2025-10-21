
import { useState } from 'react';
import { Club, User } from './types';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { toast } from '@/hooks/use-toast';

export const useClubManagement = (
  currentUser: User | null, 
  setCurrentUser: (user: User | null | ((prev: User | null) => User | null)) => void
) => {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [isCreatingClub, setIsCreatingClub] = useState(false);

  // Update the function signature to accept two parameters
  const createClub = async (name: string, logo: string = '/placeholder.svg'): Promise<Club | null> => {
    if (!currentUser) {
      toast({
        title: "Error creating club",
        description: "You must be logged in to create a club",
        variant: "destructive"
      });
      return null;
    }
    
    // Prevent concurrent club creation
    if (isCreatingClub) {
      console.log('[useClubManagement] Club creation already in progress');
      return null;
    }
    
    setIsCreatingClub(true);
    
    try {
      console.log('[useClubManagement] Creating club:', name);
      
      // Create slug from club name
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      
      // Pre-check for duplicate club names/slugs
      const { data: existingClubs, error: checkError } = await safeSupabase
        .from('clubs')
        .select('id, name, slug')
        .or(`name.eq.${name},slug.eq.${slug}`)
        .limit(1);
      
      if (checkError) {
        throw new Error(`Error checking for existing clubs: ${checkError.message}`);
      }
      
      if (existingClubs && existingClubs.length > 0) {
        throw new Error('A club with this name already exists. Please choose a different name.');
      }
      
      // Insert the new club
      const { data: clubData, error: clubError } = await safeSupabase
        .from('clubs')
        .insert({
          name,
          logo, // Use the logo parameter
          division: 'bronze',
          tier: 5,
          elite_points: 0,
          created_by: currentUser.id,
          bio: `Welcome to ${name}! We're a group of passionate runners looking to challenge ourselves and improve together.`,
          slug
        })
        .select()
        .single();

      if (clubError || !clubData) {
        // Handle specific PostgreSQL unique constraint violations
        if (clubError?.code === '23505') {
          if (clubError.message.includes('clubs_name_key')) {
            throw new Error('A club with this name already exists. Please choose a different name.');
          } else if (clubError.message.includes('clubs_slug_key')) {
            throw new Error('A club with this name already exists. Please choose a different name.');
          } else {
            throw new Error('This club name is already taken. Please choose a different name.');
          }
        }
        throw new Error(clubError?.message || 'Error creating club');
      }

      console.log('[useClubManagement] Club created:', clubData);

      // Add the creator as an admin member
      const { error: memberError } = await safeSupabase
        .from('club_members')
        .insert({
          club_id: clubData.id,
          user_id: currentUser.id,
          is_admin: true
        });

      if (memberError) {
        throw new Error(memberError.message);
      }

      // Since we can't rely on complex joins with the current setup,
      // we'll create a club object directly
      const newClub: Club = {
        id: clubData.id,
        name: clubData.name,
        logo: clubData.logo || '/placeholder.svg',
        division: clubData.division.toLowerCase() as Club['division'],
        tier: clubData.tier,
        elitePoints: clubData.elite_points || 0,
        bio: clubData.bio || '',
        members: [{
          id: currentUser.id,
          name: currentUser.name,
          avatar: currentUser.avatar || '/placeholder.svg',
          isAdmin: true,
          distanceContribution: 0
        }],
        matchHistory: []
      };

      // Update user's clubs in context
      setCurrentUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          clubs: [...(prev.clubs || []), newClub]
        };
      });

      setSelectedClub(newClub);
      
      console.log('[useClubManagement] Club created successfully:', newClub);
      
      return newClub;
    } catch (error) {
      console.error('[useClubManagement] Error in createClub:', error);
      toast({
        title: "Error creating club",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreatingClub(false);
    }
  };

  return {
    selectedClub,
    setSelectedClub,
    createClub,
    isCreatingClub
  };
};
