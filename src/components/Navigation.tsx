
import React from 'react';
import { Home, Trophy, User } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

interface NavigationProps {
  // We could add props here in the future if needed, but now we don't need any
}

const Navigation: React.FC<NavigationProps> = () => {
  const { currentView, setCurrentView, setSelectedUser, currentUser, selectedUser, needsProfileCompletion } = useApp();
  const location = useLocation();
  
  // Don't show navigation on the connect-device page
  if (location.pathname === '/connect-device') {
    return null;
  }

  // Don't show navigation during profile completion
  if (needsProfileCompletion) {
    return null;
  }

  const handleProfileClick = () => {
    // Always set selectedUser to currentUser when clicking profile in nav
    if (currentUser) {
      setSelectedUser(currentUser);
    }
    setCurrentView('profile');
  };

  // Check if we're viewing the current user's profile
  const isViewingOwnProfile = 
    currentView === 'profile' && 
    selectedUser?.id === currentUser?.id;

  const navItems = [
    { 
      view: 'home' as const, 
      label: 'Home', 
      icon: Home,
      onClick: () => setCurrentView('home')
    },
    { 
      view: 'leaderboard' as const, 
      label: 'Leagues', 
      icon: Trophy,
      onClick: () => setCurrentView('leaderboard')
    },
    { 
      view: 'profile' as const, 
      label: 'Profile', 
      icon: User,
      onClick: handleProfileClick,
      active: isViewingOwnProfile // This will determine if it should be highlighted
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-background border-t border-border bottom-nav">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => (
          <button
            key={item.view}
            onClick={item.onClick}
            className={cn(
              'flex flex-col items-center justify-center h-full w-full text-xs font-medium transition-colors',
              (item.hasOwnProperty('active') ? item.active : currentView === item.view)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
