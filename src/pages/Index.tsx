import * as React from 'react';
import { useApp } from '@/context/AppContext';
import ConnectScreen from '@/components/ConnectScreen';
import HomeView from '@/components/home/HomeView';
import ClubDetail from '@/components/ClubDetail';
import Leaderboard from '@/components/Leaderboard';
import UserProfile from '@/components/UserProfile';
import Navigation from '@/components/Navigation';
import { Toaster } from '@/components/ui/toaster';
import ChatDrawer from '@/components/chat/ChatDrawer';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useUnreadMessages } from '@/context/UnreadMessagesContext';

const Index: React.FC = () => {
  const { currentView, currentUser, needsProfileCompletion } = useApp();
  const { totalUnreadCount } = useUnreadMessages();
  const { isOpen: chatDrawerOpen, open: openChatDrawer, close: closeChatDrawer } = useChatDrawerGlobal();

  console.log('[Index] Current view:', currentView, 'Current user:', currentUser ? currentUser.id : 'null');
  console.log('[Index] Needs profile completion:', needsProfileCompletion);

  const memoizedClubs = React.useMemo(() => currentUser?.clubs || [], [currentUser?.clubs]);

  const renderView = () => {
    // If there's no user, always show the connect screen
    if (!currentUser) {
      console.log('[Index] No user detected, rendering ConnectScreen');
      return <ConnectScreen />;
    }

    // If user needs to complete their profile, show the ConnectScreen (which contains LoginForm)
    // The LoginForm will detect this state and show the profile completion form
    if (needsProfileCompletion) {
      console.log('[Index] User needs to complete profile, rendering ConnectScreen');
      return <ConnectScreen />;
    }

    // Only render other views if user is authenticated and profile is completed
    switch (currentView) {
      case 'connect':
        console.log('[Index] Rendering ConnectScreen');
        return <ConnectScreen />;
      case 'home':
        console.log('[Index] Rendering HomeView');
        return <HomeView chatNotifications={totalUnreadCount} />;
      case 'clubDetail':
        console.log('[Index] Rendering ClubDetail');
        return <ClubDetail />;
      case 'leaderboard':
        console.log('[Index] Rendering Leaderboard');
        return <Leaderboard />;
      case 'profile':
        console.log('[Index] Rendering UserProfile');
        return <UserProfile />;
      default:
        console.log('[Index] No matching view, defaulting to ConnectScreen');
        return <ConnectScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderView()}
      {currentUser && !needsProfileCompletion && currentView !== 'connect' && <Navigation />}
      {currentUser && !needsProfileCompletion && (
        <ChatDrawer 
          open={chatDrawerOpen} 
          onOpenChange={open => open ? openChatDrawer() : closeChatDrawer()}
          clubs={memoizedClubs}
        />
      )}
      <Toaster />
    </div>
  );
};

export default Index;
