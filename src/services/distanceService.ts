import { safeSupabase } from '@/integrations/supabase/safeClient';

export interface DistanceContribution {
  match_id: string;
  user_id: string;
  club_id: string;
  distance_km: number;
}

export const submitMatchDistance = async (submission: DistanceContribution) => {
  try {
    const { data, error } = await safeSupabase
      .from('match_distance_contributions')
      .insert(submission)
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error submitting distance contribution:', error);
    throw error;
  }
};

// This function is now handled directly in the useWeeklyDistance hook
// using the Supabase RPC function
export const getWeeklyDistance = async (userId: string): Promise<number> => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(now.getDate() - 7);

    const { data, error } = await safeSupabase.rpc('get_weekly_distance', {
      user_id: userId,
      start_date: oneWeekAgo.toISOString(),
      end_date: now.toISOString()
    });

    if (error) throw error;
    return Number(data) || 0;
  } catch (error) {
    console.error('Error fetching weekly distance:', error);
    return 0;
  }
};

// Function to get match distances for a specific user and match (sum of contributions)
export const getUserMatchDistance = async (userId: string, matchId: string): Promise<number> => {
  try {
    const { data, error } = await safeSupabase
      .from('match_distance_contributions')
      .select('distance_km')
      .eq('user_id', userId)
      .eq('match_id', matchId);

    if (error) throw error;

    const total = (data || []).reduce((sum, row: any) => sum + (Number(row.distance_km) || 0), 0);
    return total;
  } catch (error) {
    console.error('Error fetching user match distance:', error);
    return 0;
  }
};
