
import { useEffect } from 'react';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { AppView, User } from '@/types';
import { useLoadCurrentUser } from './useLoadCurrentUser';
import { toast } from '@/hooks/use-toast';

// Reduced timeout for faster resolution
export const AUTH_TIMEOUT = 5000;

interface AuthSessionCoreProps {
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  setCurrentView: React.Dispatch<React.SetStateAction<AppView>>;
  setUserLoading: (loading: boolean) => void;
  setAuthChecked: (checked: boolean) => void;
  setAuthError: (error: string | null) => void;
}

export const useAuthSessionCore = ({
  setCurrentUser,
  setCurrentView,
  setUserLoading,
  setAuthChecked,
  setAuthError,
}: AuthSessionCoreProps) => {
  const { loadCurrentUser } = useLoadCurrentUser();

  useEffect(() => {
    let isMounted = true;
    
    console.log('[useAuthSessionCore] Setting up auth session listener');

    // Set up the auth state change listener
    const { data } = safeSupabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      
      console.log('[useAuthSessionCore] Auth state changed:', { 
        event, 
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user?.id) {
          try {
            // Only set loading if user explicitly tried to sign in (event === 'SIGNED_IN')
            if (event === 'SIGNED_IN') {
              setUserLoading(true);
            }
            
            console.log('[useAuthSessionCore] Loading user profile for ID:', session.user.id);
            
            // Create a basic user first with session details
            const basicUser: User = {
              id: session.user.id,
              name: session.user.email || 'User',
              avatar: '/placeholder.svg',
              bio: '',
              clubs: []
            };
            
            // Set the basic user immediately for better UX
            setCurrentUser(basicUser);
            
            // Fetch full user profile in the background
            // No setTimeout needed, call directly
            loadCurrentUser(session.user.id).then((userProfile) => {
              if (isMounted && userProfile) {
                console.log('[useAuthSessionCore] User profile loaded:', userProfile.id);
                setCurrentUser(userProfile);
                
                // Log additional user information for debugging
                console.log('[useAuthSessionCore] Updated user context with:', {
                  id: userProfile.id,
                  name: userProfile.name,
                  clubsCount: userProfile.clubs?.length || 0
                });
              }
            }).catch((profileError) => {
              console.warn('[useAuthSessionCore] Error loading full profile, using basic user:', profileError);
            }).finally(() => {
              if (isMounted) {
                setUserLoading(false);
              }
            });
            
            // Even with just the basic user, proceed to home view
            setCurrentView('home');
            setAuthChecked(true);
          } catch (error) {
            console.error('[useAuthSessionCore] Error in auth flow:', error);
            if (isMounted) {
              setAuthError(error instanceof Error ? error.message : 'Authentication error');
              setUserLoading(false);
              setAuthChecked(true);
            }
          }
        } else {
          console.warn('[useAuthSessionCore] Session exists but no user ID');
          if (isMounted) {
            setAuthChecked(true);
            setUserLoading(false);
            setCurrentView('connect');
          }
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('[useAuthSessionCore] User signed out');
        if (isMounted) {
          setCurrentUser(null);
          setCurrentView('connect');
          setAuthChecked(true);
          setUserLoading(false);
        }
      } else {
        console.log('[useAuthSessionCore] Other auth event:', event);
        if (isMounted) {
          setAuthChecked(true);
          setUserLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      
      // Clean up the subscription
      if (data && data.subscription && typeof data.subscription.unsubscribe === 'function') {
        data.subscription.unsubscribe();
      }
    };
  }, [setCurrentUser, setCurrentView, setUserLoading, setAuthChecked, setAuthError, loadCurrentUser]);
};
