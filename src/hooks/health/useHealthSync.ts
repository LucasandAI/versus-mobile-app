import { Capacitor } from '@capacitor/core';
import { CapacitorHealthkit, SampleNames } from '@perfood/capacitor-healthkit';
import { useCallback, useRef, useEffect } from 'react';
import { safeSupabase } from '../../integrations/supabase/safeClient';
import type { User } from '../../types';

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

export function useHealthSync(): UseHealthSyncReturn {
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
      
      // Get the last sync time or default to 7 days ago
      const now = new Date();
      const lastSync = forceSync 
        ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago for force sync
        : lastSyncRef.current 
          ? new Date(lastSyncRef.current) 
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago for regular sync
      
      console.log('[HealthSync] Querying data from:', lastSync.toISOString());
      
      // Query HealthKit for distance data
      const response = await CapacitorHealthkit.queryHKitSampleType({
        sampleName: SampleNames.DISTANCE_WALKING_RUNNING,
        startDate: lastSync.toISOString(),
        endDate: now.toISOString(),
        limit: 10000, // Adjust based on expected data volume
      }) as unknown as QueryResponse<HKDistanceSample>;

      console.log(`[HealthSync] Found ${response?.resultData?.length || 0} samples`);

      if (!response?.resultData || response.resultData.length === 0) {
        console.log('[HealthSync] No new data to sync');
        lastSyncRef.current = now;
        return;
      }

      // Process and upload the data
      const activities = response.resultData.map(sample => {
        // Ensure we have valid dates
        const startDate = new Date(sample.startDate);
        const endDate = new Date(sample.endDate);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.warn('[HealthSync] Invalid date range for sample:', sample);
          return null;
        }
        
        return {
          user_id: user.id,
          activity_type: 'walking',
          distance_meters: toMeters(sample.value, sample.unitName),
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          source: sample.source || 'HealthKit',
          source_id: sample.uuid || `${startDate.getTime()}-${endDate.getTime()}`,
          metadata: {
            device: sample.device,
            source_bundle_id: sample.sourceBundleId,
          },
        };
      }).filter(Boolean); // Filter out any invalid entries

      console.log(`[HealthSync] Uploading ${activities.length} activities`);
      
      // Upload to your backend
      const { error } = await safeSupabase
        .from('activities')
        .upsert(activities, { onConflict: 'user_id,source_id' });

      if (error) {
        throw new Error(`Failed to save activities: ${error.message}`);
      }

      // Update last sync time
      lastSyncRef.current = now;
      console.log('[HealthSync] Sync completed successfully');
      
    } catch (error) {
      console.error('[HealthSync] Error syncing with HealthKit:', error);
      // Don't throw to prevent unhandled promise rejections
    }
  }, []);

  const startHealthSync = useCallback((user: User, intervalMinutes = 60) => {
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