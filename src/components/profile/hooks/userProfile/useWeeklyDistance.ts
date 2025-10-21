import { useState, useEffect } from "react";
import { safeSupabase } from '@/integrations/supabase/safeClient';

// Cache for weekly distance with TTL
const weeklyDistanceCache: Record<string, { value: number; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export const useWeeklyDistance = (userId: string | undefined) => {
  const [weeklyDistance, setWeeklyDistance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    
    const fetchDistance = async () => {
      const now = Date.now();
      const cachedValue = weeklyDistanceCache[userId];
      
      // Return cached value if it exists and is fresh
      if (cachedValue && (now - cachedValue.timestamp < CACHE_TTL)) {
        setWeeklyDistance(cachedValue.value);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const todayLocal = new Date();
        const startLocal = new Date(todayLocal); // 7-day window inclusive of today: today and previous 6 days
        startLocal.setDate(todayLocal.getDate() - 6);

        // Format as YYYY-MM-DD (LOCAL)
        const fmtLocal = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        // 1) Prefer aggregated source
        const { data: agg, error: aggErr } = await safeSupabase
          .from('user_activity_agg')
          .select('per_day')
          .eq('user_id', userId)
          .maybeSingle();

        if (!aggErr && agg?.per_day) {
          const per_day = agg.per_day as Record<string, number>;
          // Sum today + previous 6 days
          let total = 0;
          for (let i = 0; i < 7; i++) {
            const d = new Date(todayLocal);
            d.setDate(todayLocal.getDate() - i);
            const key = fmtLocal(d);
            total += Number(per_day[key] ?? 0);
          }
          weeklyDistanceCache[userId] = { value: total, timestamp: Date.now() };
          setWeeklyDistance(total);
          setIsLoading(false);
          return;
        }

        // 2) Fallback: per-day table
        const { data, error: fetchError } = await safeSupabase
          .from('user_activities')
          .select('distance_meters, activity_date')
          .eq('user_id', userId)
          .gte('activity_date', fmtLocal(startLocal))
          .lte('activity_date', fmtLocal(todayLocal));

        if (fetchError) throw fetchError;
        const totalMeters = (data ?? []).reduce((sum, r) => sum + Number(r.distance_meters ?? 0), 0);
        weeklyDistanceCache[userId] = { value: totalMeters, timestamp: Date.now() };
        setWeeklyDistance(totalMeters);
      } catch (err) {
        console.error('Error fetching weekly distance:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch weekly distance'));
        
        // If we have a stale cache, use it
        if (cachedValue) {
          setWeeklyDistance(cachedValue.value);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDistance();
  }, [userId, refreshNonce]);

  // Listen to global health refresh events to force refetch
  useEffect(() => {
    const onHealthRefreshed = () => {
      if (userId) {
        delete weeklyDistanceCache[userId];
        setRefreshNonce(n => n + 1);
      }
    };
    window.addEventListener('healthRefreshed', onHealthRefreshed);
    return () => window.removeEventListener('healthRefreshed', onHealthRefreshed);
  }, [userId]);
  
  return { 
    weeklyDistance, 
    isLoading, 
    error,
    // Allow manual refresh of the distance
    refresh: () => {
      if (userId) {
        delete weeklyDistanceCache[userId];
      }
      setWeeklyDistance(0);
      setIsLoading(true);
      setRefreshNonce(n => n + 1);
    }
  };
};
