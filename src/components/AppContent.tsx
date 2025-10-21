import React from 'react';
import { useApp } from '@/context/AppContext';
import LoadingScreen from '@/components/shared/LoadingScreen';
import ConnectScreen from '@/components/ConnectScreen';
import HomeView from '@/components/HomeView';
import ClubDetail from '@/components/ClubDetail';
import UserProfile from '@/components/UserProfile';
import Leaderboard from '@/components/Leaderboard';
import Navigation from '@/components/Navigation';
import ToastErrorHandler from '@/components/ToastErrorHandler';
import { useClubMembershipSync } from '@/hooks/useClubMembershipSync';
import { useNotificationListener } from '@/hooks/useNotificationListener';

interface AppContentProps {
  children?: React.ReactNode;
}

const AppContent: React.FC<AppContentProps> = ({ children }) => {
  const { currentView, currentUser } = useApp();
  
  // Set up real-time club membership sync
  useClubMembershipSync();
  
  // Set up notification listener for immediate UI updates
  useNotificationListener();

  // If no user is authenticated, show the connect screen
  if (!currentUser) {
    return <ConnectScreen />;
  }

  const renderCurrentView = () => {
    // If children are provided, render them instead of the default views
    if (children) {
      return children;
    }

    switch (currentView) {
      case 'home':
        return <HomeView />;
      case 'clubDetail':
        return <ClubDetail />;
      case 'profile':
        return <UserProfile />;
      case 'leaderboard':
        return <Leaderboard />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 with-bottom-nav">
      <Navigation />
      <main>
        {renderCurrentView()}
      </main>
      <ToastErrorHandler />
    </div>
  );
};

export default AppContent;
