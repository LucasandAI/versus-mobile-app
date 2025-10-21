import { useState, useEffect, useCallback, useRef } from 'react';
import { CapacitorHealthkit } from '@perfood/capacitor-healthkit';
import { toast } from '@/hooks/use-toast';

type AuthStatus = 'authorized' | 'denied' | 'notDetermined' | 'notAvailable';

interface AuthStatusResult {
  [key: string]: AuthStatus;
}

interface HealthDataPoint {
  value: number;
  unit: string;
  startDate: string;
  endDate: string;
}

export const useAppleHealth = () => {
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  const distanceRef = useRef<number>(0);
  const lastSyncRef = useRef<Date | null>(null);
  
  // Update refs when state changes
  useEffect(() => {
    distanceRef.current = distance;
  }, [distance]);
  
  useEffect(() => {
    lastSyncRef.current = lastSync;
  }, [lastSync]);

  // Check if Health is available and permissions are granted
  const checkHealthAvailability = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if HealthKit is available
      await CapacitorHealthkit.isAvailable();
      setIsAvailable(true);
      
      // Check current auth status
      const authStatus = await CapacitorHealthkit.checkAuthStatus({
        types: ['distance']
      }) as AuthStatusResult;
      
      const isAuthorized = authStatus.distance === 'authorized';
      setIsConnected(isAuthorized);
      
      if (isAuthorized) {
        // Initial distance fetch
        await syncDistance();
      }
      
      return true;
    } catch (err) {
      console.error('Error checking health availability:', err);
      setIsAvailable(false);
      setError('Health data is not available on this device');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request HealthKit permissions
  const requestPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Request authorization with proper options
      await CapacitorHealthkit.requestAuthorization({
        all: [],
        read: ['distance'],
        write: []
      });
      
      // Check the new auth status
      const authStatus = await (CapacitorHealthkit as any).checkAuthStatus({
        types: ['distance']
      }) as AuthStatusResult;
      
      const isAuthorized = authStatus.distance === 'authorized';
      setIsConnected(isAuthorized);
      
      if (isAuthorized) {
        toast({
          title: 'Connected to Apple Health',
          description: 'Your running distance will now sync with Versus',
        });
        await syncDistance();
      } else {
        toast({
          title: 'Permission Required',
          description: 'Please grant access to Health data to continue',
          variant: 'destructive',
        });
      }
      
      return isAuthorized;
    } catch (err) {
      console.error('Error requesting health permissions:', err);
      setError('Failed to request health data permissions');
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to Apple Health. Please check your settings and try again.',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Sync distance from HealthKit
  const syncDistance = useCallback(async () => {
    try {
      if (!isConnected) return 0;
      
      const now = new Date();
      const startDate = lastSyncRef.current || new Date(now.getTime() - 5 * 60 * 1000); // Last 5 minutes or since last sync

      // Note: The actual query method might need adjustment based on the plugin's API
      const result = await (CapacitorHealthkit as any).queryHits({
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        dataType: 'distance',
        limit: 1000
      }) as HealthDataPoint[];

      let totalDistance = 0;
      
      if (result?.length) {
        totalDistance = result.reduce((sum, item) => sum + (item.value || 0), 0);
        if (totalDistance > 0) {
          setDistance(prev => prev + totalDistance);
        }
      }
      
      setLastSync(now);
      return totalDistance;
    } catch (err) {
      console.error('Error syncing distance:', err);
      setError('Failed to sync distance data');
      return 0;
    }
  }, [isConnected]);

  // Start/stop distance tracking
  const startTracking = useCallback(async () => {
    if (!isConnected) {
      const authorized = await requestPermissions();
      if (!authorized) return false;
    }
    
    // Initial sync
    await syncDistance();
    return true;
  }, [isConnected, requestPermissions, syncDistance]);

  // Check health availability on mount
  useEffect(() => {
    checkHealthAvailability();
  }, [checkHealthAvailability]);

  return {
    isAvailable,
    isConnected,
    isLoading,
    error,
    distance,
    lastSync,
    requestPermissions,
    syncDistance,
    startTracking,
    resetDistance: () => setDistance(0)
  };
};

export default useAppleHealth;
