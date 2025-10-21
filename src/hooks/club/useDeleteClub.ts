
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { toast } from '@/hooks/use-toast';
import { safeSupabase } from '@/integrations/supabase/safeClient';
import { Club } from '@/types';

export const useDeleteClub = () => {
  const { currentUser, setCurrentUser, setSelectedClub, setCurrentView } = useApp();
  const [loading, setLoading] = useState(false);

  const deleteClub = async (club: Club) => {
    if (!currentUser) return false;
    setLoading(true);
    try {
      // Run delete with RLS protection (only creators/admins allowed)
      const { error } = await safeSupabase
        .from('clubs')
        .delete()
        .eq('id', club.id);

      if (error) throw new Error(error.message);

      // Remove the club from user context
      setCurrentUser(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          clubs: prev.clubs.filter(c => c.id !== club.id)
        };
      });
      setSelectedClub(null);
      setCurrentView('home');

      toast({
        title: 'Club deleted',
        description: `${club.name} and all related data has been deleted.`
      });
      return true;
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Could not delete club',
        variant: 'destructive'
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteClub, loading };
};
