
import { useState } from 'react';
import { AppView, Club, User } from '@/types';

export const useViewState = () => {
  // Default to 'connect' view to ensure the login screen is shown first
  const [currentView, setCurrentView] = useState<AppView>('connect');
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  return {
    currentView,
    setCurrentView,
    selectedClub,
    setSelectedClub,
    selectedUser,
    setSelectedUser
  };
};
