
import { useState, useEffect, useRef } from 'react';
import { useWeeklyDistance } from './userProfile/useWeeklyDistance';
import { useApp } from '@/context/AppContext';

export const useUserProfileStateLogic = () => {
  const { selectedUser } = useApp();
  const [loading, setLoading] = useState(false);
  const [weeklyDistance, setWeeklyDistance] = useState(0);
  const previousUserId = useRef<string | null>(null);
  
  // Optimized to fetch data immediately when user ID changes
  useEffect(() => {
    const fetchDistance = async () => {
      if (selectedUser?.id && previousUserId.current !== selectedUser.id) {
        setLoading(true);
        
        try {
          // Get weekly distance - this is now faster with caching
          const distance = await useWeeklyDistance(selectedUser.id);
          setWeeklyDistance(distance);
        } catch (error) {
          console.error('Error fetching weekly distance:', error);
          setWeeklyDistance(0);
        } finally {
          setLoading(false);
          previousUserId.current = selectedUser.id;
        }
      }
    };
    
    fetchDistance();
  }, [selectedUser?.id]);
  
  return {
    loading,
    weeklyDistance,
  };
};
