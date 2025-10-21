
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { ensureDivision } from '@/utils/club/leagueUtils';

export const useClubDetails = (clubId: string | undefined) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchClubDetails = async () => {
    if (!clubId) return null;
    
    try {
      console.log('[useClubDetails] Fetching club with ID:', clubId);
      setIsLoading(true);
      
      const { data: clubData, error } = await supabase
        .from('clubs')
        .select('id, name, logo, division, tier, bio, elite_points, created_by')
        .eq('id', clubId)
        .single();
        
      if (error) {
        console.error('[useClubDetails] Supabase error:', error);
        throw new Error('Error fetching club: ' + error.message);
      }
      
      if (!clubData) {
        console.error('[useClubDetails] No club data returned for ID:', clubId);
        throw new Error('No club data found');
      }
      
      console.log('[useClubDetails] Retrieved club data:', clubData);
      
      // Create club object with safe defaults for all fields
      return {
        id: clubData.id,
        name: clubData.name || 'Unnamed Club',
        logo: clubData.logo || '/placeholder.svg',
        division: ensureDivision(clubData.division),
        tier: clubData.tier || 5,
        elitePoints: clubData.elite_points || 0,
        bio: clubData.bio || `Welcome to this running club! We're a group of passionate runners looking to challenge ourselves and improve together.`,
        createdBy: clubData.created_by,
        members: [], // Will be populated by useClubMembers
        matchHistory: [] // Will be populated by useClubMatches
      };
    } catch (error) {
      console.error('[useClubDetails] Error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { fetchClubDetails, isLoading, error };
};
