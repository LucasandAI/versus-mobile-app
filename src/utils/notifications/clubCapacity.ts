
import { supabase } from '@/integrations/supabase/client';

// Check if a club is full (has 5 or more members)
export const checkClubCapacity = async (clubId: string): Promise<{
  isFull: boolean;
  memberCount: number;
}> => {
  try {
    const { data, error, count } = await supabase
      .from('club_members')
      .select('user_id', { count: 'exact' })
      .eq('club_id', clubId);
      
    if (error) {
      console.error('[checkClubCapacity] Error:', error);
      return { 
        isFull: false, // Default to false to avoid blocking functionality on error
        memberCount: 0
      };
    }
    
    const memberCount = count || 0;
    return {
      isFull: memberCount >= 5,
      memberCount
    };
  } catch (error) {
    console.error('[checkClubCapacity] Unexpected error:', error);
    return { isFull: false, memberCount: 0 };
  }
};
