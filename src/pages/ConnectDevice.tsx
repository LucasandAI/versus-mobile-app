import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CapacitorHealthkit, SampleNames } from '@perfood/capacitor-healthkit';
import type { User } from '@/types';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { useHealthSync } from '@/hooks/health/useHealthSync';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { HealthKitDebug } from '@/components/health/HealthKitDebug';
import { DebugHealthSync } from '@/components/health/DebugHealthSync';

const READ_PERMISSIONS = ['distance']; // short key your build recognizes
const SHOW_DEBUG = false; // flip to true locally if you need verbose logs

type HealthKitSample = {
  value?: number;
  quantity?: string | number;
  startDate: string;
  endDate: string;
  [key: string]: any;
};

type Preview = {
  today_m: number;
  last7d_m: number;
  lastSampleAt?: string;
};

const ConnectDevice: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useApp();
  const [isConnecting, setIsConnecting] = useState(false);
  const [authInFlight, setAuthInFlight] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const healthSync = useHealthSync();
  const WRITE_HEALTH_TO_DB = true;

  // ---------- utils ----------
  const fmtLocalDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`; // YYYY-MM-DD in LOCAL time
  };
  const storePreview = useCallback(async (p: Preview) => {
    try {
      if (!currentUser?.id) return;
      
      // Get today's date in local time
      const todayDate = new Date();
      const activityDate = fmtLocalDate(todayDate);
      
      // Check if we already have data for today
      const { data: existingActivities, error } = await safeSupabase
        .from('user_activities')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('activity_date', activityDate);

      if (error) throw error;
      
      // If we already have data for today, only update if the new data is from a more recent source
      // or if there's no source yet (backward compatibility)
      if (existingActivities && existingActivities.length > 0) {
        const existingActivity = existingActivities[0];
        const existingDistance = existingActivity.distance_meters || 0;
        
        // If the existing distance is significantly different (more than 10% difference)
        // and the new distance is higher, update the record
        const isSignificantDifference = Math.abs(existingDistance - p.today_m) > (existingDistance * 0.1);
        
        if (isSignificantDifference && p.today_m > existingDistance) {
          await safeSupabase
            .from('user_activities')
            .update({
              distance_meters: p.today_m,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingActivity.id);
        }
      } else {
        // No existing activity for today, insert new one
        await safeSupabase
          .from('user_activities')
          .insert({
            user_id: currentUser.id,
            activity_date: activityDate,
            distance_meters: p.today_m,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
    } catch (err) {
      // Non-blocking: just log
      console.warn('[HK] Failed to store user activity:', err);
    }
  }, [currentUser?.id]);

  // Write aggregated per-day JSON and total_m (one row per user)
  const persistAgg = useCallback(async (perDayMeters: Record<string, number>, total_m: number) => {
    try {
      if (!currentUser?.id) return;
      // Trim to last 30 days to keep payload small
      const keys = Object.keys(perDayMeters).sort().slice(-30);
      const per_day: Record<string, number> = {};
      for (const k of keys) per_day[k] = Math.round(perDayMeters[k] ?? 0);

      await safeSupabase
        .from('user_activity_agg')
        .upsert({
          user_id: currentUser.id,
          per_day,
          total_m: Math.round(total_m),
          last_updated: new Date().toISOString(),
        })
        .eq('user_id', currentUser.id);
    } catch (e) {
      console.warn('[HK] Failed to persist user_activity_agg:', e);
    }
  }, [currentUser?.id]);

  // Compute and upsert total match contributions per active match for user's clubs
  const persistMatchContributions = useCallback(async () => {
    try {
      if (!currentUser?.id) return;

      // 1) Fetch user's clubs
      const { data: memberships, error: memErr } = await safeSupabase
        .from('club_members')
        .select('club_id')
        .eq('user_id', currentUser.id);
      if (memErr) throw memErr;
      const clubIds = (memberships ?? []).map(m => m.club_id).filter(Boolean);
      if (!clubIds.length) return;

      // 2) Fetch active matches where user clubs participate
      const { data: matches, error: matchErr } = await safeSupabase
        .from('matches')
        .select('id, home_club_id, away_club_id, start_date, end_date, status')
        .eq('status', 'active')
        .or(`home_club_id.in.(${clubIds.join(',')}),away_club_id.in.(${clubIds.join(',')})`);
      if (matchErr) throw matchErr;
      if (!matches?.length) return;

      // 3) For each match, sum distance from user_activities between match window
      const today = new Date();
      const rows: Array<{ match_id: string; user_id: string; club_id: string; contribution_date: string; distance_meters: number; }> = [];

      for (const m of matches) {
        const start = new Date(m.start_date);
        const end = new Date(m.end_date ?? today);
        const windowEnd = end > today ? today : end;

        const startDay = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate())).toISOString().slice(0,10);
        const endDay = new Date(Date.UTC(windowEnd.getUTCFullYear(), windowEnd.getUTCMonth(), windowEnd.getUTCDate())).toISOString().slice(0,10);

        const { data: acts, error: actErr } = await safeSupabase
          .from('user_activities')
          .select('distance_meters, activity_date')
          .eq('user_id', currentUser.id)
          .gte('activity_date', startDay)
          .lte('activity_date', endDay);
        if (actErr) throw actErr;

        const total = (acts ?? []).reduce((sum, a) => sum + Number(a.distance_meters ?? 0), 0);
        const userClubForMatch = clubIds.includes(m.home_club_id) ? m.home_club_id : m.away_club_id;

        rows.push({
          match_id: m.id,
          user_id: currentUser.id,
          club_id: userClubForMatch,
          // store the total against the match end date (or today if ongoing)
          contribution_date: endDay,
          distance_meters: total,
        });
      }

      if (rows.length) {
        await safeSupabase
          .from('match_contributions')
          .upsert(rows, { onConflict: 'match_id,user_id' });
      }
    } catch (e) {
      console.warn('[HK] Failed to persist match contributions:', e);
    }
  }, [currentUser?.id]);
  const sumMeters = (samples: HealthKitSample[]) => 
    samples.reduce((acc, s) => {
      const raw = Number((s as any).value ?? (s as any).quantity ?? 0);
      const unit = (s as any).unitName || (s as any).unit || 'meter';
      // Normalize to meters
      const meters = unit === 'meter' || unit === 'm' ? raw
        : unit === 'kilometer' || unit === 'km' ? raw * 1000
        : raw; // fallback assume meters
      return acc + meters;
    }, 0);

  const readPreview = useCallback(async (): Promise<Preview | null> => {
    try {
      // --- Local day helpers (no UTC conversions) ---
      const startOfDay = (d: Date) => {
        const t = new Date(d);
        t.setHours(0, 0, 0, 0);
        return t;
      };
      const endOfDay = (d: Date) => {
        const t = new Date(d);
        t.setHours(23, 59, 59, 999);
        return t;
      };
      const fmtLocal = (d: Date) => {
        // pure local YYYY-MM-DD, never toISOString()
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      };

      // --- Window: last 7 days inclusive of today ---
      // Get current date in local timezone
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculate start date (6 days before today)
      const sevenStart = new Date(today);
      sevenStart.setDate(today.getDate() - 6);
      
      // Set end date to end of today
      const sevenEnd = new Date(today);
      sevenEnd.setHours(23, 59, 59, 999);
      
      // Debug log the date range
      console.log('--- Date Range Debug ---');
      console.log('Today (start of day):', today.toISOString(), 'Local:', fmtLocal(today));
      console.log('7 days window start:', sevenStart.toISOString(), 'Local:', fmtLocal(sevenStart));
      console.log('7 days window end:', sevenEnd.toISOString(), 'Local:', fmtLocal(sevenEnd));
      
      // Log all dates in the range for verification
      console.log('--- 7-Day Range ---');
      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenStart);
        d.setDate(sevenStart.getDate() + i);
        console.log(`Day ${i + 1}:`, fmtLocal(d), d.toDateString());
      }

      // --- Query WR only in that window ---
      // Convert local dates to UTC for HealthKit query
      const wr = await CapacitorHealthkit.queryHKitSampleType({
        sampleName: SampleNames.DISTANCE_WALKING_RUNNING,
        startDate: new Date(sevenStart.getTime() - sevenStart.getTimezoneOffset() * 60000).toISOString(),
        endDate: new Date(sevenEnd.getTime() - sevenEnd.getTimezoneOffset() * 60000).toISOString(),
        limit: 100000,
      });
      let wrSamples = Array.isArray(wr?.resultData) ? (wr.resultData as HealthKitSample[]) : [];

      // --- Query cycling separately and exclude overlaps (defensive) ---
      const cy = await CapacitorHealthkit.queryHKitSampleType({
        sampleName: (SampleNames as any).DISTANCE_CYCLING ?? 'DISTANCE_CYCLING',
        startDate: new Date(sevenStart.getTime() - sevenStart.getTimezoneOffset() * 60000).toISOString(),
        endDate: new Date(sevenEnd.getTime() - sevenEnd.getTimezoneOffset() * 60000).toISOString(),
        limit: 100000,
      }).catch(() => ({ resultData: [] as any[] }));
      let cySamples = Array.isArray(cy?.resultData) ? (cy.resultData as HealthKitSample[]) : [];

      // Deduplicate by UUID (or timestamp+value)
      const uniqBy = (arr: HealthKitSample[]) => {
        const seen = new Set<string>();
        const out: HealthKitSample[] = [];
        for (const s of arr) {
          const id = (s as any).uuid || `${s.startDate}|${s.endDate}|${(s as any).value ?? (s as any).quantity ?? 0}`;
          if (!seen.has(id)) { seen.add(id); out.push(s); }
        }
        return out;
      };
      wrSamples = uniqBy(wrSamples);
      cySamples = uniqBy(cySamples);

      const keyFor = (s: HealthKitSample) => {
        const meters = Math.round(Number((s as any).value ?? (s as any).quantity ?? 0));
        const a = Math.floor(new Date(s.startDate).getTime() / 1000);
        const b = Math.floor(new Date((s.endDate ?? s.startDate)).getTime() / 1000);
        const uuid = (s as any).uuid ?? '';
        return `${uuid}|${meters}|${a}|${b}`;
      };
      const cyKeys = new Set(cySamples.map(keyFor));
      const wrOnly = wrSamples.filter(s => !cyKeys.has(keyFor(s)));

      // --- Bucket by LOCAL day (no ISO conversions) ---
      const perDay: Record<string, HealthKitSample[]> = {};
      for (const s of wrOnly) {
        const d = new Date(s.endDate ?? s.startDate);
        const key = fmtLocal(d);                      // local YYYY-MM-DD
        (perDay[key] = perDay[key] || []).push(s);
      }

      // --- Compute today and last-7 (inclusive today) ---
      const todayKey = fmtLocal(today);
      const last7Keys: string[] = [];
      
      // Generate exactly 7 days (today + 6 previous days)
      // Start from 6 days ago and go up to today (7 days total)
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dayKey = fmtLocal(d);
        last7Keys.push(dayKey);
      }
      
      console.log('Last 7 days keys:', last7Keys);  // Debug log the keys being used

      // distance normalization (meters)
      const metersOf = (s: HealthKitSample) => {
        const raw = Number((s as any).value ?? (s as any).quantity ?? 0);
        const unit = (s as any).unitName || (s as any).unit || 'meter';
        return unit === 'meter' || unit === 'm'
          ? raw
          : unit === 'kilometer' || unit === 'km'
          ? raw * 1000
          : raw;
      };
      const sumArr = (arr: HealthKitSample[]) => arr.reduce((acc, s) => acc + metersOf(s), 0);

      const today_m = Math.round(sumArr(perDay[todayKey] ?? []));
      
      // Calculate 7-day total with debug logging
      let last7_m = 0;
      console.log('--- 7-Day Distance Calculation ---');
      last7Keys.forEach((dayKey, index) => {
        const dayTotal = sumArr(perDay[dayKey] ?? []);
        last7_m += dayTotal;
        console.log(`Day ${index + 1} (${dayKey}):`, Math.round(dayTotal * 100) / 100, 'meters');
      });
      last7_m = Math.round(last7_m);
      
      console.log('--- Final Totals ---');
      console.log('Today:', today_m, 'meters');
      console.log('Last 7 days:', last7_m, 'meters');

      const lastSampleAt = wrOnly
        .map(s => new Date(s.endDate ?? s.startDate).toISOString())
        .sort()
        .pop();

      // If query succeeded, we're authorized—even if both totals are 0
      return { today_m, last7d_m: last7_m, lastSampleAt };
    } catch (e) {
      console.error('[HK] readPreview error (WR only):', e);
      return null; // no HK / no permission
    }
  }, []);

  // Process and store last 7 days of walking/running data
  const persistLast7Days = useCallback(async () => {
    if (!currentUser?.id) return;
    
    try {
      // Get dates in local time
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      const start7 = new Date(today);
      start7.setDate(today.getDate() - 6); // 7 days total (today + 6 days)
      start7.setHours(0, 0, 0, 0); // Start of day
      
      // Format dates for database queries (YYYY-MM-DD)
      const formatDbDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dd}`;
      };
      
      // Helper to get local date string from a date
      const getLocalDateStr = (date: Date) => {
        return formatDbDate(new Date(date.getTime() - (date.getTimezoneOffset() * 60000)));
      };
      
      // Get fresh data from HealthKit with proper timezone handling
      const wr = await CapacitorHealthkit.queryHKitSampleType({
        sampleName: SampleNames.DISTANCE_WALKING_RUNNING,
        startDate: start7.toISOString(),
        endDate: today.toISOString(),
        limit: 100000,
      });
      
      const wrSamples = Array.isArray(wr?.resultData) ? (wr.resultData as HealthKitSample[]) : [];
      
      // Get cycling data to exclude from walking/running
      const cy = await CapacitorHealthkit.queryHKitSampleType({
        sampleName: (SampleNames as any).DISTANCE_CYCLING ?? 'DISTANCE_CYCLING',
        startDate: start7.toISOString(),
        endDate: today.toISOString(),
        limit: 100000,
      }).catch(() => ({ resultData: [] as any[] }));
      
      const cySamples = Array.isArray(cy?.resultData) ? (cy.resultData as HealthKitSample[]) : [];
      
      // Process samples by day
      const dailyTotals: Record<string, number> = {};
      
      // Initialize all 7 days with 0
      for (let d = new Date(start7); d <= today; d.setDate(d.getDate() + 1)) {
        dailyTotals[formatDbDate(new Date(d))] = 0;
      }
      
      // Process walking/running samples
      for (const sample of wrSamples) {
        const sampleDate = new Date(sample.startDate);
        const localDate = getLocalDateStr(sampleDate);
        const distance = Number(sample.value ?? sample.quantity ?? 0);
        
        // Only add if it's within our 7-day window
        if (dailyTotals.hasOwnProperty(localDate)) {
          dailyTotals[localDate] += distance;
        }
      }
      
      // Process cycling samples to exclude from walking/running
      for (const sample of cySamples) {
        const sampleDate = new Date(sample.startDate);
        const localDate = getLocalDateStr(sampleDate);
        const distance = Number(sample.value ?? sample.quantity ?? 0);
        
        // Subtract cycling distance from walking/running for the same day
        if (dailyTotals.hasOwnProperty(localDate)) {
          dailyTotals[localDate] = Math.max(0, dailyTotals[localDate] - distance);
        }
      }
      
      // Get existing activities to avoid unnecessary updates
      const { data: existingActivities, error: fetchError } = await safeSupabase
        .from('user_activities')
        .select('*')
        .eq('user_id', currentUser.id)
        .gte('activity_date', formatDbDate(start7))
        .lte('activity_date', formatDbDate(today));
      
      if (fetchError) throw fetchError;
      
      // Create a map of existing activities by date
      const existingByDate = new Map<string, any>();
      existingActivities?.forEach(activity => {
        existingByDate.set(activity.activity_date, activity);
      });
      
      // Update or insert daily totals
      const upsertPromises = Object.entries(dailyTotals).map(async ([date, distance]) => {
        const roundedDistance = Math.round(distance);
        const existing = existingByDate.get(date);
        
        // Only update if the distance has changed significantly (more than 10%)
        if (existing) {
          const currentDistance = existing.distance_meters || 0;
          const isSignificantChange = Math.abs(currentDistance - roundedDistance) > (currentDistance * 0.1);
          
          if (isSignificantChange) {
            return safeSupabase
              .from('user_activities')
              .update({
                distance_meters: roundedDistance,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existing.id);
          }
          return null;
        } else {
          // Insert new record
          return safeSupabase
            .from('user_activities')
            .insert({
              user_id: currentUser.id,
              activity_date: date,
              distance_meters: roundedDistance,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
        }
      });
      
      // Wait for all upserts to complete
      await Promise.all(upsertPromises);
      
      // Update the aggregated data
      const total7Days = Object.values(dailyTotals).reduce((sum, dist) => sum + dist, 0);
      await persistAgg(dailyTotals, total7Days);
      
    } catch (error) {
      console.error('[HK] Error in persistLast7Days:', error);
      throw error; // Re-throw to be caught by the caller
    }
  }, [currentUser?.id, persistAgg]);

  // Helper function to convert distance to meters
  const metersOf = (s: HealthKitSample): number => {
    const raw = Number((s as any).value ?? (s as any).quantity ?? 0);
    const unit = (s as any).unitName || (s as any).unit || 'meter';
    return unit === 'meter' || unit === 'm' 
      ? raw 
      : unit === 'kilometer' || unit === 'km' 
        ? raw * 1000 
        : raw;
  };
  
  // Load HealthKit status and preview
  const loadHKStatusAndPreview = useCallback(async (requireData: boolean = true): Promise<boolean> => {
    try {
      if (Capacitor.getPlatform() !== 'ios') {
        setIsAvailable(false);
        setIsConnected(false);
        setPreview(null);
        return false;
      }
      
      await CapacitorHealthkit.isAvailable();
      setIsAvailable(true);

      // Respect manual disconnect override: do not auto-connect
      const override = (await Preferences.get({ key: 'hk_disconnect_override' })).value === '1';
      if (override) {
        setIsConnected(false);
        setPreview(null);
        return false;
      }

      const p = await readPreview();
      // If we require actual data (on cold load), treat zeroed preview as not connected
      const hasAnyData = !!p && ((p.today_m ?? 0) > 0 || (p.last7d_m ?? 0) > 0 || !!p.lastSampleAt);

      const considerConnected = !!p && (!requireData || hasAnyData);

      if (considerConnected) {
        setPreview(p!);
        setIsConnected(true);
        setLastSyncAt(new Date().toISOString());
        if (currentUser?.id) {
          await safeSupabase
            .from('users')
            .update({ health_connected: true })
            .eq('id', currentUser.id);
          setCurrentUser(prev => prev ? { ...prev, health_connected: true } : prev);
        }
        // Fire-and-forget DB writes are gated until verified
        if (WRITE_HEALTH_TO_DB) {
          // Write aggregated record (persistLast7Days builds and writes agg)
          void persistLast7Days();
          void persistMatchContributions();
          // Legacy snapshot write (optional):
          // void storePreview(p!);
        }
        return true;
      } else {
        setPreview(null); // ensure preview is cleared when not connected
        setIsConnected(false);
        setLastSyncAt(null);
        if (currentUser?.id) {
          await safeSupabase
            .from('users')
            .update({ health_connected: false })
            .eq('id', currentUser.id);
          setCurrentUser(prev => prev ? { ...prev, health_connected: false } : prev);
        }
        return false;
      }
    } catch (error) {
      console.error('Error loading HealthKit status:', error);
      setIsAvailable(false);
      setIsConnected(false);
      setPreview(null);
      return false;
    }
  }, [currentUser?.id, readPreview, setCurrentUser]);

  // Load status on mount: require real data to consider connected
  useEffect(() => {
    void loadHKStatusAndPreview(true);
  }, [loadHKStatusAndPreview]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      try { healthSync.cleanup(); } catch {}
    };
  }, [healthSync]);

  // Manual refresh handler
  const handleRefresh = useCallback(async () => {
    if (!isConnected) return;
    setIsRefreshing(true);
    try {
      await loadHKStatusAndPreview(false);
      // Always write aggregated per-day data for validation of weekly overlay
      await persistLast7Days(); // writes user_activity_agg
      // Keep legacy per-day and match contributions behind the flag
      if (WRITE_HEALTH_TO_DB) {
        await persistMatchContributions();
      }
      toast({ title: 'Refreshed', description: 'Apple Health data updated.' });
      setLastSyncAt(new Date().toISOString());
      // Notify listeners (e.g., weekly overlay) that health data was refreshed
      try {
        window.dispatchEvent(new CustomEvent('healthRefreshed'));
      } catch {}
    } catch (e) {
      toast({ title: 'Refresh failed', description: 'Could not refresh Apple Health data.', variant: 'destructive' });
    } finally {
      setIsRefreshing(false);
    }
  }, [isConnected, loadHKStatusAndPreview, persistLast7Days]);

  // Background refresh while connected: update preview and last 7 days periodically
  useEffect(() => {
    if (!isConnected) return;
    let timer: any;
    const tick = async () => {
      try {
        await loadHKStatusAndPreview(false);
        if (WRITE_HEALTH_TO_DB) {
          await persistLast7Days();
          await persistMatchContributions();
        }
        setLastSyncAt(new Date().toISOString());
      } catch (e) {
        // swallow, will try again next tick
      }
    };
    // first refresh shortly after mount/connect
    tick();
    // then every 15 minutes
    timer = setInterval(tick, 15 * 60 * 1000);
    return () => clearInterval(timer);
  }, [isConnected, loadHKStatusAndPreview, persistLast7Days]);

  const handleConnect = useCallback(async () => {
    if (!currentUser || authInFlight) return;
    setIsConnecting(true);
    setAuthInFlight(true);
    
    try {
      // Clear manual disconnect override on explicit connect
      await Preferences.remove({ key: 'hk_disconnect_override' });

      await CapacitorHealthkit.isAvailable();

      const authOptions = { 
        read: READ_PERMISSIONS, 
        write: [], 
        all: READ_PERMISSIONS 
      };
      
      console.log('HK auth payload:', authOptions);
      await CapacitorHealthkit.requestAuthorization(authOptions);

      // Re-check immediately and get the new connection status (do not require samples right after granting permission)
      const nowConnected = await loadHKStatusAndPreview(false);

      // Start periodic sync if we are now connected
      if (nowConnected && currentUser?.id) {
        try { 
          healthSync.startHealthSync(currentUser, 60); 
        } catch (error) {
          console.error('Error starting health sync:', error);
        }
      }

      toast({ 
        title: 'Apple Health connected', 
        description: 'Reading distance data.' 
      });
      
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Could not connect to Apple Health.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
      setAuthInFlight(false);
    }
  }, [authInFlight, currentUser, healthSync, loadHKStatusAndPreview]);

  const handleDisconnect = useCallback(async () => {
    if (!currentUser) return;
    try {
      healthSync.cleanup(); // Stop any ongoing sync

      // Set manual disconnect override so we don't auto-connect on next load
      await Preferences.set({ key: 'hk_disconnect_override', value: '1' });

      await safeSupabase
        .from('users')
        .update({ health_connected: false })
        .eq('id', currentUser.id);
        
      setCurrentUser(prev => prev ? { ...prev, health_connected: false } : prev);
      setIsConnected(false);
      setPreview(null);
      
      toast({ 
        title: 'Disconnected', 
        description: 'Apple Health disconnected.' 
      });
      
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Could not disconnect.', 
        variant: 'destructive' 
      });
    }
  }, [currentUser, setCurrentUser, healthSync]);

  const formatKm = (m: number) => (m / 1000).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="p-4">
          <button 
            onClick={() => navigate(-1)} 
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm font-medium"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isConnected ? 'Connected to Apple Health' : 'Connect Apple Health'}
            </h1>
            <p className="text-gray-600">
              {isConnected 
                ? 'Your walking and running distance is being tracked.'
                : 'Connect to track your walking and running distance.'}
            </p>
            
            <div className="mt-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
          </div>
          
          {isAvailable === false && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Apple Health is not available on this device. Please use an iOS device with HealthKit support.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Preview Card */}
          {isConnected && preview && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 shadow-sm">
              <h3 className="font-medium text-gray-900 mb-3">Walking + Running</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Today</p>
                  <p className="text-xl font-semibold">
                    {formatKm(preview.today_m)} <span className="text-sm font-normal text-gray-500">km</span>
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Last 7 Days</p>
                  <p className="text-xl font-semibold">
                    {formatKm(preview.last7d_m)} <span className="text-sm font-normal text-gray-500">km</span>
                  </p>
                </div>
              </div>
              {/* removed last sync sentence per request */}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {isAvailable && !isConnected && (
              <Button
                onClick={handleConnect}
                disabled={isConnecting || authInFlight}
                className="w-full"
                size="lg"
              >
                {isConnecting || authInFlight ? 'Connecting...' : 'Connect Apple Health'}
              </Button>
            )}

            {isConnected && (
              <>
                <Button
                  variant="secondary"
                  onClick={handleRefresh}
                  className="w-full"
                  disabled={isConnecting || authInFlight || isRefreshing}
                >
                  {isRefreshing ? 'Refreshing…' : 'Refresh data'}
                </Button>
                <div className="rounded-md border border-gray-200 p-3 text-sm text-gray-700 mt-3">
                  To disconnect Apple Health, go to iOS Settings → Privacy & Security → Health → Apps and revoke access for this app.
                </div>
              </>
            )}

            {!isAvailable && (
              <Button 
                disabled 
                className="w-full"
                variant="outline"
              >
                Apple Health Not Available
              </Button>
            )}
          </div>

          {/* Info Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {isConnected 
                ? 'Your walking and running distance will be synced automatically.'
                : 'We only request permission to read your walking and running distance.'}
            </p>
          </div>

          {/* Debug Info - gated to reduce log noise */}
          {SHOW_DEBUG && (
            <div className="mt-12 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-4">Debug Information</h3>
              <div className="space-y-6">
                <HealthKitDebug />
                <DebugHealthSync />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectDevice;
