import { CapacitorHealthkit, SampleNames } from '@perfood/capacitor-healthkit';
import { safeSupabase } from '@/integrations/supabase/safeClient';

export interface DebugResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

export async function debugHealthKitConnection(userId: string): Promise<DebugResult> {
  try {
    // 1) Availability (resolves or throws; no boolean)
    await CapacitorHealthkit.isAvailable();

    // 2) Request authorization (use simple strings for scopes per perfood docs)
    await CapacitorHealthkit.requestAuthorization({
      all: ['distance'],
      read: ['distance'],
      write: [],
    });

    // 3) DB check
    const { data: userData, error: userError } = await safeSupabase
      .from('users')
      .select('health_connected')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: `Database error: ${userError?.message || 'User not found'}`,
      };
    }

    return {
      success: true,
      data: {
        healthKitAvailable: true,          // reached here without throwing
        permissionsRequested: ['distance'],// we requested these
        userHealthConnected: userData.health_connected,
      },
    };
  } catch (error) {
    console.error('HealthKit debug error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during HealthKit debug',
    };
  }
}

// Optional: small sanity query against HealthKit (uses the enum)
export async function debugQueryLastDay(): Promise<DebugResult> {
  try {
    const now = new Date();
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const result = await CapacitorHealthkit.queryHKitSampleType({
      sampleName: SampleNames.DISTANCE_WALKING_RUNNING,
      startDate: start.toISOString(),
      endDate: now.toISOString(),
      limit: 1000,
    });

    return {
      success: true,
      data: {
        count: result.countReturn,
        first: result.resultData?.[0] ?? null,
      },
    };
  } catch (error) {
    console.error('HealthKit sample query error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during sample query',
    };
  }
}

export async function checkHealthKitSchema(): Promise<DebugResult> {
  try {
    // Check if the health_kit_data table exists and has the correct schema
    const { data, error } = await safeSupabase.rpc('check_healthkit_schema');
    
    if (error) {
      return { 
        success: false, 
        error: `Schema check failed: ${error.message}`,
        data: { error }
      };
    }

    return { 
      success: true, 
      data: {
        schemaValid: data?.is_valid || false,
        schemaCheck: data
      }
    };
  } catch (error) {
    console.error('Schema check error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error during schema check'
    };
  }
}
