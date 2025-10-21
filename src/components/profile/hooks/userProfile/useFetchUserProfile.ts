
import { supabase } from '@/integrations/supabase/client';

// Simple in-memory cache for user profiles
const userProfileCache: Record<string, {
  data: any,
  timestamp: number
}> = {};

// Cache TTL in milliseconds (2 minutes)
const CACHE_TTL = 120000; 

export const useFetchUserProfile = async (userId: string) => {
  // Check for cached profile
  const cachedProfile = userProfileCache[userId];
  const now = Date.now();
  
  if (cachedProfile && (now - cachedProfile.timestamp < CACHE_TTL)) {
    return { userData: cachedProfile.data, error: null };
  }
  
  // Fetch all user profile fields in one optimized query
  const { data: userData, error } = await supabase
    .from('users')
    .select('id, name, avatar, bio, instagram, twitter, facebook, linkedin, website, tiktok')
    .eq('id', userId)
    .maybeSingle();

  // Cache the result if successful
  if (userData && !error) {
    userProfileCache[userId] = {
      data: userData,
      timestamp: now
    };
  }

  return { userData, error };
};

// Export function to clear the cache
export const clearUserProfileCache = (userId?: string) => {
  if (userId) {
    delete userProfileCache[userId];
  } else {
    // Clear all cache if no userId specified
    Object.keys(userProfileCache).forEach(key => {
      delete userProfileCache[key];
    });
  }
};
