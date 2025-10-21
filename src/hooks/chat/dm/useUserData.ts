
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { UserCache } from './types';

export const useUserData = () => {
  // Use ref for a more stable cache across renders
  const userCacheRef = useRef<UserCache>({});
  const [userCache, setUserCache] = useState<UserCache>(userCacheRef.current);
  const [fetchingUsers, setFetchingUsers] = useState<Set<string>>(new Set());
  const pendingFetches = useRef<Record<string, Promise<any>>>({});

  // Sync state with ref when state changes
  useEffect(() => {
    userCacheRef.current = userCache;
  }, [userCache]);

  // Callback to fetch user data
  const fetchUserData = useCallback(async (userId: string) => {
    // Skip if invalid userId
    if (!userId) {
      console.warn('[useUserData] Called fetchUserData with invalid userId');
      return null;
    }
    
    // Return cached data immediately if available
    if (userCacheRef.current[userId]) {
      console.log(`[useUserData] Using cached data for user ${userId}:`, userCacheRef.current[userId]);
      return userCacheRef.current[userId];
    }
    
    // If we already have a pending fetch for this user, return that promise
    if (pendingFetches.current[userId]) {
      console.log(`[useUserData] Returning existing fetch promise for user ${userId}`);
      return pendingFetches.current[userId];
    }
    
    // Skip if already fetching this user
    if (fetchingUsers.has(userId)) {
      console.log(`[useUserData] Already fetching user ${userId}`);
      return null;
    }
    
    try {
      setFetchingUsers(prev => {
        const updated = new Set(prev);
        updated.add(userId);
        return updated;
      });
      
      console.log(`[useUserData] Fetching user data for ${userId}`);
      
      // Create a new promise for this fetch
      const fetchPromise = new Promise(async (resolve) => {
        try {
          const { data: userData, error } = await supabase
            .from('users')
            .select('name, avatar, bio')
            .eq('id', userId)
            .single();
  
          if (error) {
            console.error('[useUserData] Error fetching user data:', error);
            resolve(null);
            return;
          }
  
          if (userData) {
            const userWithDefaults = {
              name: userData.name || 'User',
              avatar: userData.avatar || '/placeholder.svg',
              bio: userData.bio || ''
            };
            
            console.log(`[useUserData] Successfully fetched data for user ${userId}:`, userWithDefaults);
            
            // Update both the ref and state for immediate access
            userCacheRef.current = {
              ...userCacheRef.current,
              [userId]: userWithDefaults
            };
            
            setUserCache(prev => ({
              ...prev,
              [userId]: userWithDefaults
            }));
            
            resolve(userWithDefaults);
            return userWithDefaults;
          }
          
          resolve(null);
          return null;
        } catch (error) {
          console.error('[useUserData] Exception fetching user data:', error);
          resolve(null);
          return null;
        }
      });
      
      // Store the promise
      pendingFetches.current[userId] = fetchPromise;
      
      // Wait for the fetch to complete
      const result = await fetchPromise;
      
      // Remove from pending fetches
      delete pendingFetches.current[userId];
      
      return result;
    } catch (error) {
      console.error('[useUserData] Exception in fetchUserData:', error);
      return null;
    } finally {
      setFetchingUsers(prev => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    }
  }, []);

  // Fetch any missing user data from stored conversations on mount
  useEffect(() => {
    const fetchStoredUsers = async () => {
      try {
        const conversationsString = localStorage.getItem('directConversations');
        if (!conversationsString) return;
        
        const conversations = JSON.parse(conversationsString);
        if (!Array.isArray(conversations)) return;
        
        const userIds = conversations.map(c => c.userId).filter(Boolean);
        
        for (const userId of userIds) {
          if (!userCacheRef.current[userId] && !fetchingUsers.has(userId)) {
            fetchUserData(userId);
          }
        }
      } catch (error) {
        console.error('[useUserData] Error prefetching stored users:', error);
      }
    };
    
    fetchStoredUsers();
  }, [fetchUserData, fetchingUsers]);

  return { userCache, setUserCache, fetchUserData };
};
