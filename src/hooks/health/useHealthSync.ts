import { Capacitor } from '@capacitor/core';
import { CapacitorHealthkit, SampleNames } from '@perfood/capacitor-healthkit';
import { useCallback, useRef, useEffect } from 'react';
import { safeSupabase } from '../../integrations/supabase/safeClient';
import type { User } from '../../types';

// Helper function to convert date to local YYYY-MM-DD string
const toLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Type definitions for HealthKit responses
interface HealthKitAuthResult {
  [key: string]: { read: string; write: string } | string;
}

interface HealthKitSample {
  uuid: string;
  value: number;
  unit?: string;
  startDate: string;
  endDate: string;
  sourceName?: string;
  sourceBundleId?: string;
  device?: {
    name?: string;
    model?: string;
    manufacturer?: string;
  };
}

interface HealthKitQueryResponse<T = any> {
  countReturn?: number;
  resultData?: T[];
  data?: T[];
  error?: string;
  success?: boolean;
}

// Interface for the query response
interface QueryResponse<T> {
  countReturn: number;
  resultData: T[];
}

interface HKDistanceSample {
  uuid: string;
  value: number;
  unitName: string;
  startDate: string;
  endDate: string;
  source: string;
  sourceBundleId: string;
  device: HKDeviceInfo | null;
  duration?: number;
  workoutActivityType?: number;
}

interface HealthKitQueryResult<T> {
  resultData: T[];
  countReturn: number;
}

// Minimal local types aligned with perfood plugin docs
type HKDeviceInfo = {
  name: string;
  manufacturer: string;
  model: string;
  hardwareVersion: string;
  softwareVersion: string;
};

type HKBaseData = {
  startDate: string;
  endDate: string;
  source: string;
  uuid: string;
  sourceBundleId: string;
  device: HKDeviceInfo | null;
  duration: number;
};

type HKOtherData = HKBaseData & {
  unitName: string; // e.g. "m" | "km" | "mi"
  value: number;    // numeric distance value in unitName
};

type HKQueryOutput<T> = {
  countReturn: number;
  resultData: T[];
};

const toMeters = (value?: number, unitName?: string) => {
  if (value == null) return 0;
  switch ((unitName || '').toLowerCase()) {
    case 'm':  return value;
    case 'km': return value * 1000;
    case 'mi': return value * 1609.344;
    default:   return value; // best effort; log unknown units
  }
};

function parseHealthKitResponse(response: any): HealthKitQueryResponse {
  try {
    // If response is already in the correct format
    if (response && Array.isArray(response.data)) {
      return {
        data: response.data,
        countReturn: response.countReturn || 0,
        resultData: response.data
      };
    }
    
    // If response is an array directly
    if (Array.isArray(response)) {
      return {
        data: response,
        countReturn: response.length,
        resultData: response
      };
    }
    
    // If response has a resultData field (common in some HealthKit plugins)
    if (response && Array.isArray(response.resultData)) {
      return { 
        data: response.resultData,
        countReturn: response.countReturn || response.resultData.length,
        resultData: response.resultData
      };
    }
    
    console.error('[HealthSync] Unrecognized HealthKit response format:', response);
    return { data: [], error: 'Unrecognized response format' };
  } catch (error) {
    console.error('[HealthSync] Error parsing HealthKit response:', error);
    return { data: [], error: 'Failed to parse response' };
  }
}

interface UseHealthSyncReturn {
  startHealthSync: (user: User, intervalMinutes?: number) => () => void;
  syncDeltas: (user: User, forceSync?: boolean) => Promise<void>;
  cleanup: () => void;
}

type PersistAggFunction = (perDayMeters: Record<string, number>) => Promise<void>;

export function useHealthSync(persistAgg: PersistAggFunction): UseHealthSyncReturn {
  const lastSyncRef = useRef<Date | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialSyncRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (initialSyncRef.current) {
      clearTimeout(initialSyncRef.current);
      initialSyncRef.current = null;
    }
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []); // Refs are stable and don't need to be in the dependency array

  const syncDeltas = useCallback(async (user: User, forceSync = false): Promise<void> => {
    if (!user?.id) {
      console.error('[HealthSync] No user provided for sync');
      return;
    }

    try {
      // Check if HealthKit is available on this device
      if (Capacitor.getPlatform() !== 'ios') {
        console.log('[HealthSync] HealthKit is only available on iOS');
        return;
      }

      // Check HealthKit availability
      try {
        await CapacitorHealthkit.isAvailable();
      } catch (error) {
        console.error('[HealthSync] HealthKit not available on this device:', error);
        return;
      }

      console.log('[HealthSync] Querying HealthKit data...');
      
      // Since we're only querying running workouts, we can hardcode these values
      const workoutType = 'running';
      const activityType = 'running';

      // Get the last sync time or default to 7 days ago
      const now = new Date();
      const lastSync = forceSync 
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago for force sync
        : lastSyncRef.current 
          ? new Date(lastSyncRef.current) 
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago for regular sync
      
      console.log('[HealthSync] Querying data from:', lastSync.toISOString());
      
      console.log('[HealthSync] Requesting workouts from HealthKit...');
      
      // Query HealthKit for both workouts and distance data
      const [workoutResponse, distanceResponse] = await Promise.all([
        // Get running workouts
        CapacitorHealthkit.queryHKitSampleType({
          sampleName: SampleNames.WORKOUT_TYPE,
          startDate: lastSync.toISOString(),
          endDate: now.toISOString(),
          limit: 10000
        }) as unknown as QueryResponse<HKDistanceSample>,
        
        // Get all walking/running distance data (no unit parameter as it's not in the type)
        CapacitorHealthkit.queryHKitSampleType({
          sampleName: SampleNames.DISTANCE_WALKING_RUNNING,
          startDate: lastSync.toISOString(),
          endDate: now.toISOString(),
          limit: 10000
        }) as unknown as QueryResponse<HKDistanceSample>
      ]);

      // Combine and process both data sources
      let response = {
        resultData: [
          ...(workoutResponse?.resultData || []),
          ...(distanceResponse?.resultData || [])
        ],
        countReturn: (workoutResponse?.countReturn || 0) + (distanceResponse?.countReturn || 0)
      };
      
      // Process and combine the data
      if (response?.resultData) {
        const originalCount = response.resultData.length;
        
        // Log the first few samples for debugging
        console.log('[HealthSync] Sample data from HealthKit:', 
          response.resultData.slice(0, 3).map(d => ({
            startDate: d.startDate,
            value: d.value,
            unit: d.unitName,
            type: d.workoutActivityType ? 'workout' : 'distance'
          }))
        );
        
        // Process the data
        const dailyTotals = new Map<string, number>();
        let sampleCount = 0;
        let filteredCount = 0;
        
        console.log(`[HealthSync] Processing ${response.resultData.length} samples...`);
        
        for (const sample of response.resultData) {
          try {
            sampleCount++;
            const startDate = new Date(sample.startDate);
            
            if (isNaN(startDate.getTime())) {
              console.warn('[HealthSync] Invalid date for sample:', sample);
              continue;
            }
            
            const dateKey = toLocalDateString(startDate);
            const distanceMeters = toMeters(sample.value, sample.unitName);
            
            // Skip invalid or negative distances
            if (isNaN(distanceMeters) || distanceMeters <= 0) {
              filteredCount++;
              continue;
            }
            
            // Log sample details for debugging
            if (sampleCount <= 5) { // Only log first few samples to avoid flooding
              console.log(`[HealthSync] Sample ${sampleCount}:`, {
                date: dateKey,
                value: sample.value,
                unit: sample.unitName,
                meters: distanceMeters,
                type: sample.workoutActivityType ? 'workout' : 'distance'
              });
            }
            
            dailyTotals.set(
              dateKey,
              (dailyTotals.get(dateKey) || 0) + distanceMeters
            );
          } catch (error) {
            console.error('[HealthSync] Error processing sample:', error, sample);
          }
        }
        
        // Log processing summary
        console.log(`[HealthSync] Processed ${sampleCount} samples (${filteredCount} filtered out)`);
        
        // Convert to the format expected by persistAgg and round to 2 decimal places
        const perDayMeters = Object.fromEntries(
          Array.from(dailyTotals.entries()).map(([date, meters]) => [
            date,
            Math.round(meters * 100) / 100 // Round to 2 decimal places
          ])
        );
        
        const totalMeters = Array.from(dailyTotals.values())
          .reduce((sum, dist) => sum + dist, 0);
        
        console.log('[HealthSync] Daily distances (m):', perDayMeters);
        console.log(`[HealthSync] Total distance: ${totalMeters.toFixed(2)}m`);
        
        // Save to Supabase
        if (Object.keys(perDayMeters).length > 0) {
          console.log('[HealthSync] Saving to Supabase...');
await persistAgg(perDayMeters);
          console.log('[HealthSync] Data saved to Supabase');
        } else {
          console.log('[HealthSync] No valid data to save');
        }
        
        // Convert back to the expected format for the rest of the function
        response.resultData = Array.from(dailyTotals.entries()).map(([date, value]) => ({
          uuid: `processed-${date}`,
          value,
          unitName: 'm',
          startDate: new Date(date).toISOString(),
          endDate: new Date(new Date(date).setHours(23, 59, 59, 999)).toISOString(),
          device: null,
          source: 'versus-processed',
          sourceBundleId: 'com.versus.app',
          // Add workoutActivityType to ensure compatibility with existing code
          workoutActivityType: 1
        }));
        
        if (originalCount > 0) {
          console.log(`[HealthSync] Found ${response.resultData.length} running workouts out of ${originalCount} total workouts`);
        }
      }

      console.log(`[HealthSync] Found ${response?.resultData?.length || 0} samples`);

      if (!response?.resultData || response.resultData.length === 0) {
        console.log('[HealthSync] No new data to sync');
        lastSyncRef.current = now;
        return;
      }

      // Group activities by date (YYYY-MM-DD)
      const activitiesByDate = new Map<string, number>();
      
      response.resultData.forEach(sample => {
        try {
          const startDate = new Date(sample.startDate);
          if (isNaN(startDate.getTime())) {
            console.warn('[HealthSync] Invalid date for sample:', sample);
            return;
          }
          
          const dateKey = toLocalDateString(startDate); // Use local date for grouping
          const distanceMeters = toMeters(sample.value, sample.unitName);
          
          // Sum distances for the same date
          activitiesByDate.set(
            dateKey,
            (activitiesByDate.get(dateKey) || 0) + distanceMeters
          );
        } catch (error) {
          console.error('[HealthSync] Error processing sample:', error, sample);
        }
      });
      
      // Convert to array of activities by date
      const activities = Array.from(activitiesByDate.entries()).map(([date, distanceMeters]) => ({
        user_id: user.id,
        activity_date: date,
        distance_meters: Math.round(distanceMeters), // Round to nearest meter
        source: 'HealthKit',
        source_type: 'running_workout',
        updated_at: new Date().toISOString()
      }));

      console.log(`[HealthSync] Uploading ${activities.length} daily activity records`);
      
      // Update or insert daily activity records
      for (const activity of activities) {
        const { data: existing, error: fetchError } = await safeSupabase
          .from('user_activities')
          .select('id, distance_meters')
          .eq('user_id', activity.user_id)
          .eq('activity_date', activity.activity_date)
          .single();
        
        if (fetchError && fetchError.code !== 'PGRST116') { // Ignore 'not found' error
          console.error('[HealthSync] Error checking for existing activity:', fetchError);
          continue;
        }
        
        // Only update if the new distance is greater than existing
        if (existing && existing.distance_meters >= activity.distance_meters) {
          console.log(`[HealthSync] Skipping update for ${activity.activity_date} - existing distance is greater or equal`);
          continue;
        }
        
        const { error } = await safeSupabase
          .from('user_activities')
          .upsert(activity, { onConflict: 'user_id,activity_date' });
          
        if (error) {
          console.error(`[HealthSync] Error saving activity for ${activity.activity_date}:`, error);
          continue;
        }
      }

      // Update last sync time
      lastSyncRef.current = now;
      console.log('[HealthSync] Sync completed successfully');
    } catch (error) {
      console.error('[HealthSync] Error syncing with HealthKit:', error);
      // Don't throw to prevent unhandled promise rejections
    }
  }, []);

  const startHealthSync = useCallback((user: User, intervalMinutes = 60): (() => void) => {
    // Clear any existing intervals
    cleanup();

    console.log(`[HealthSync] Starting health sync with ${intervalMinutes} minute interval`);

    // Initial sync with a small delay to allow UI to update
    initialSyncRef.current = setTimeout(() => {
      syncDeltas(user, true)
        .then(() => {
          console.log('[HealthSync] Initial sync completed successfully');
        })
        .catch(error => {
          console.error('[HealthSync] Initial sync failed:', error);
        });
    }, 2000);

    // Set up periodic sync
    if (intervalMinutes > 0) {
      console.log(`[HealthSync] Scheduling periodic sync every ${intervalMinutes} minutes`);
      syncIntervalRef.current = setInterval(() => {
        console.log('[HealthSync] Running periodic sync...');
        syncDeltas(user)
          .then(() => {
            console.log('[HealthSync] Periodic sync completed successfully');
          })
          .catch(error => {
            console.error('[HealthSync] Periodic sync failed:', error);
          });
      }, intervalMinutes * 60 * 1000);
    }

    // Cleanup on unmount
    return () => {
      console.log('[HealthSync] Cleaning up sync timers');
      cleanup();
    };
  }, [cleanup, syncDeltas]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { startHealthSync, syncDeltas, cleanup };
}