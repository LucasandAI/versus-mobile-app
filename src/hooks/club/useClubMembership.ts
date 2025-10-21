
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Club } from '@/types';
import { hasPendingInvite } from '@/lib/notificationUtils';
import { toast } from "@/hooks/use-toast";

export const useClubMembership = (club: Club) => {
  const { currentUser, setCurrentView, setCurrentUser, setSelectedClub } = useApp();
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [hasPending, setHasPending] = useState<boolean>(false);
  const [isCheckingInvite, setIsCheckingInvite] = useState(false);

  // Safely check if club and currentUser exist
  if (!club || !club.id || !currentUser) {
    console.log('[useClubMembership] Missing club or currentUser data');
  }

  // Safely check if user is a member with null checks
  const isActuallyMember = !!(
    currentUser && 
    Array.isArray(currentUser.clubs) && 
    club && 
    club.id && 
    currentUser.clubs.some(c => c && c.id === club.id)
  );
  
  // Safely check if user is an admin with null checks
  const isAdmin = !!(
    isActuallyMember && 
    currentUser && 
    club && 
    Array.isArray(club.members) && 
    club.members.some(member => 
      member && 
      member.id === currentUser.id && 
      member.isAdmin === true
    )
  );
  
  console.log('[useClubMembership] Status check:', { 
    isActuallyMember, 
    isAdmin,
    hasMembers: Array.isArray(club?.members) ? club?.members?.length : 'no members array',
    userId: currentUser?.id
  });

  useEffect(() => {
    // Skip if club ID is missing or user is already a member
    if (!club?.id || isActuallyMember) {
      return;
    }
    
    let isMounted = true;
    
    const checkPendingInvite = async () => {
      if (!isMounted) return;
      
      try {
        setIsCheckingInvite(true);
        console.log('[useClubMembership] Checking for pending invite for club:', club.id);
        
        const pending = await hasPendingInvite(club.id);
        
        if (isMounted) {
          console.log('[useClubMembership] Pending invite status:', pending);
          setHasPending(pending);
        }
      } catch (error) {
        console.error('[useClubMembership] Error checking pending invite:', error);
        // Don't update hasPending state on error to avoid UI flickering
      } finally {
        if (isMounted) {
          setIsCheckingInvite(false);
        }
      }
    };
    
    // Initial check
    checkPendingInvite();
    
    const handleNotificationUpdate = () => {
      if (!isCheckingInvite && isMounted) {
        checkPendingInvite();
      }
    };
    
    window.addEventListener('notificationsUpdated', handleNotificationUpdate);
    
    return () => {
      isMounted = false;
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate);
    };
  }, [club?.id, isActuallyMember, isCheckingInvite]);

  return {
    isActuallyMember,
    isAdmin,
    hasPending,
    showInviteDialog,
    setShowInviteDialog,
    showLeaveDialog,
    setShowLeaveDialog,
    setHasPending
  };
};
