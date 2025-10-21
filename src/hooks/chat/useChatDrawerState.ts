
import { useState, useEffect, useCallback, useRef } from 'react';
import { Club } from '@/types';

export const useChatDrawerState = (open: boolean) => {
  // Use refs for stable references
  const selectedClubRef = useRef<Club | null>(null);
  const [selectedLocalClub, setSelectedLocalClub] = useState<Club | null>(null);

  // Stable handler that updates both state and ref
  const handleSelectClub = useCallback((club: Club) => {
    selectedClubRef.current = club;
    setSelectedLocalClub(club);
  }, []);
  
  // Reset selected club when drawer closes
  useEffect(() => {
    if (!open) {
      // Reset only when drawer actually closes, not on each render
      if (selectedLocalClub !== null) {
        setSelectedLocalClub(null);
      }
    }
  }, [open, selectedLocalClub]);

  return {
    selectedLocalClub,
    handleSelectClub
  };
};
