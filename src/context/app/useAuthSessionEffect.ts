
import { useEffect } from 'react';
import { useAuthSessionCore } from './useAuthSessionCore';
import { User, AppView } from '@/types';
import { safeSupabase } from '@/integrations/supabase/safeClient';

interface Props {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
  setUserLoading: (loading: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
  setAuthError: (error: string | null) => void;
}

/**
 * The main effect that manages authenticating the user.
 * This hook does not set initial loading state to avoid showing a loading screen
 * before the user attempts to authenticate.
 */
export const useAuthSessionEffect = ({
  setCurrentUser,
  setCurrentView,
  setUserLoading,
  setAuthChecked,
  setAuthError,
}: Props) => {
  // Initial setup effect
  useEffect(() => {
    // Start with showing the connect view until we verify auth status
    setCurrentView('connect');
    
    // Check for an active session first - do this immediately without setTimeout
    safeSupabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('[useAuthSessionEffect] Initial session check:', { 
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message
      });
      
      if (error) {
        console.error('[useAuthSessionEffect] Session check error:', error);
        setAuthError(error.message);
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
        return;
      }
      
      // If no active session, immediately show connect view
      if (!session || !session.user) {
        console.log('[useAuthSessionEffect] No active session found, showing login');
        setAuthChecked(true);
        setUserLoading(false);
        setCurrentView('connect');
      }
      // If session exists, the onAuthStateChange handler will be triggered
    }).catch((error) => {
      console.error('[useAuthSessionEffect] Session check failed:', error);
      setAuthError(error.message);
      setAuthChecked(true);
      setUserLoading(false);
      setCurrentView('connect');
    });
    
    console.log('[useAuthSessionEffect] Authentication effect initialized');
  }, [setAuthChecked, setUserLoading, setCurrentView, setAuthError]);
  
  // Setup the auth session core which will handle auth state changes
  useAuthSessionCore({
    setCurrentUser,
    setCurrentView,
    setUserLoading,
    setAuthChecked,
    setAuthError,
  });
};
