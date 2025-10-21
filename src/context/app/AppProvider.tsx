import React, { useState, ReactNode, useEffect, useCallback } from 'react';
import { AppContext } from './AppContext';
import { AppContextType, User } from '@/types';
import { updateUserInfo } from './useUserInfoSync';
import { useClubManagement } from './useClubManagement';
import { useAuth } from '@/hooks/auth/useAuth';
import { useViewState } from '@/hooks/navigation/useViewState';
import { useAuthSessionEffect } from './useAuthSessionEffect';
import { useLoadCurrentUser } from './useLoadCurrentUser';
import { toast } from '@/hooks/use-toast';
import { useHealthSync } from '@/hooks/health/useHealthSync';
import { safeSupabase } from '@/integrations/supabase/safeClient';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [userLoading, setUserLoading] = useState(false);
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);

  const { signIn, signOut } = useAuth();
  const { currentView, setCurrentView, selectedClub, setSelectedClub, selectedUser, setSelectedUser } = useViewState();
  const { createClub } = useClubManagement(currentUser, setCurrentUser);
  const { loadCurrentUser } = useLoadCurrentUser();
  const { startHealthSync } = useHealthSync();

  const refreshCurrentUser = useCallback(async () => {
    if (!currentUser?.id) return null;
    try {
      console.log('[AppProvider] Refreshing current user data for:', currentUser.id);
      const refreshedUser = await loadCurrentUser(currentUser.id);
      if (refreshedUser) {
        console.log('[AppProvider] User refreshed with clubs:', refreshedUser.clubs.length);
        setCurrentUser(refreshedUser ? updateUserInfo(refreshedUser) : null);
        return refreshedUser;
      }
      return null;
    } catch (error) {
      console.error('[AppProvider] Error refreshing user data:', error);
      toast({
        title: "Error refreshing data",
        description: "Could not load your latest information",
        variant: "destructive"
      });
      return null;
    }
  }, [currentUser, loadCurrentUser]);

  useEffect(() => {
    console.log('[AppProvider] State changed:', { 
      authChecked, 
      userLoading, 
      currentUser: currentUser?.id || 'null',
      currentView 
    });
  }, [authChecked, userLoading, currentUser, currentView]);

  // Timeout for auth check - force completion after 3 seconds
  useEffect(() => {
    if (!authChecked) {
      const timeoutId = setTimeout(() => {
        console.warn('[AppProvider] Auth check timeout reached, forcing auth checked state');
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [authChecked, setCurrentView]);
  
  // Timeout for user loading
  useEffect(() => {
    if (userLoading) {
      const timeoutId = setTimeout(() => {
        console.warn('[AppProvider] User loading timeout reached, forcing completion');
        setUserLoading(false);
        if (currentUser) {
          setCurrentView('home');
          toast({
            title: "Profile partially loaded",
            description: "Some user data may be missing. Please refresh if needed.",
            variant: "destructive"
          });
        } else {
          setCurrentView('connect');
        }
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [userLoading, currentUser, setCurrentView]);

  useAuthSessionEffect({
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
  });

  const setCurrentUserWithUpdates = (userOrFunction: User | null | ((prev: User | null) => User | null)) => {
    if (typeof userOrFunction === 'function') {
      setCurrentUser(prev => {
        const newUser = userOrFunction(prev);
        console.log('[AppProvider] Updated user via function:', newUser?.id);
        return newUser ? updateUserInfo(newUser) : newUser;
      });
    } else {
      console.log('[AppProvider] Setting current user directly:', userOrFunction?.id);
      setCurrentUser(userOrFunction ? updateUserInfo(userOrFunction) : userOrFunction);
      if (userOrFunction && currentView === 'connect') {
        setCurrentView('home');
      }
    }
  };

  // Handle health sync when health_connected status changes
  useEffect(() => {
    let stopSync: (() => void) | undefined;
    
    async function handleHealthConnection() {
      if (!currentUser?.id) return;
      
      try {
        const { data, error } = await safeSupabase
          .from('users')
          .select('health_connected')
          .eq('id', currentUser.id)
          .maybeSingle();
          
        if (error) {
          console.error('[AppProvider] Error checking health connection status:', error);
          return;
        }
        
        const isHealthConnected = data?.health_connected === true;
        console.log('[AppProvider] Health connection status:', { isHealthConnected });
        
        if (isHealthConnected) {
          console.log('[AppProvider] Starting health sync for user:', currentUser.id);
          stopSync = startHealthSync(currentUser, true); // Force sync on connection
        } else if (stopSync) {
          console.log('[AppProvider] Stopping health sync');
          stopSync();
        }
      } catch (error) {
        console.error('[AppProvider] Error in health connection handler:', error);
      }
    }
    
    handleHealthConnection();
    
    return () => {
      if (stopSync) {
        console.log('[AppProvider] Cleaning up health sync');
        stopSync();
      }
    };
  }, [currentUser?.id, currentUser?.health_connected, startHealthSync]);

  const handleSignIn = async (email: string, password: string): Promise<User | null> => {
    try {
      console.log('[AppProvider] handleSignIn called with email:', email);
      setUserLoading(true);
      
      const user = await signIn(email, password);
      
      if (user) {
        console.log('[AppProvider] Sign-in returned user:', user.id);
        setCurrentUserWithUpdates(user);
        return user;
      } else {
        console.error('[AppProvider] Sign-in failed, no user returned');
        setUserLoading(false);
        return null;
      }
    } catch (error) {
      console.error('[AppProvider] handleSignIn error:', error);
      setUserLoading(false);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Unknown error during sign-in",
        variant: "destructive"
      });
      throw error;
    }
  };

  const value: AppContextType = {
    currentUser,
    currentView,
    selectedClub,
    selectedUser,
    isSessionReady: authChecked && !!currentUser, // Simplified - only true when auth is checked and user exists
    needsProfileCompletion,
    setNeedsProfileCompletion,
    setCurrentUser: setCurrentUserWithUpdates,
    setCurrentView,
    setSelectedClub,
    setSelectedUser,
    signIn: handleSignIn,
    signOut,
    createClub,
    refreshCurrentUser
  };

  // Show loading only when auth hasn't been checked yet
  if (!authChecked) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        <p>Checking authentication...</p>
      </div>
    </div>;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
