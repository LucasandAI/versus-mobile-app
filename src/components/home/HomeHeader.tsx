import React, { useEffect, useState, useCallback } from 'react';
import { MessageCircle, Activity, User, HelpCircle, LogOut, ShieldCheck } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import UserAvatar from '../shared/UserAvatar';
import Button from '../shared/Button';
import NotificationPopover from '../shared/NotificationPopover';
import { useChatDrawerGlobal } from '@/context/ChatDrawerContext';
import { useChatBadge } from '@/hooks/useChatBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useNavigate } from 'react-router-dom';
import { clearAllAuthData } from '@/integrations/supabase/safeClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from '@/hooks/use-toast';
import { CapacitorHealthkit } from '@perfood/capacitor-healthkit';

interface HomeHeaderProps {
  notifications: any[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onUserClick: (userId: string, name: string) => void;
  onDeclineInvite: (id: string) => void;
}
const HomeHeader: React.FC<HomeHeaderProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
  onUserClick,
  onDeclineInvite
}) => {
  const {
    setCurrentView,
    currentUser,
    setSelectedUser
  } = useApp();
  const {
    open
  } = useChatDrawerGlobal();

  // Use our unified chat badge hook
  const {
    badgeCount
  } = useChatBadge(currentUser?.id);
  const navigate = useNavigate();
  const [notificationsCount, setNotificationsCount] = useState(notifications.length);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  console.log("[HomeHeader] Rendering with badge count:", badgeCount, "notifications:", notifications.length);

  // Update notifications count when notifications array changes
  useEffect(() => {
    setNotificationsCount(notifications.length);
  }, [notifications]);

  // Listen for relevant events
  useEffect(() => {
    const handleNotificationsUpdated = () => {
      setTimeout(() => {
        setNotificationsCount(notifications.length);
      }, 50);
    };
    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [notifications.length]);
  const handleViewOwnProfile = () => {
    if (currentUser) {
      setSelectedUser(currentUser);
      setCurrentView('profile');
    }
  };

  const handleConnectAppleHealth = () => {
    navigate('/connect-device');
  };

  const handleChatOpen = () => {
    open();
  };
  const handleLogout = async () => {
    try {
      await clearAllAuthData();
      window.location.reload();
      toast({
        title: "Logged out successfully",
        description: "You have been signed out of your account"
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: "Logout error",
        description: "There was a problem signing you out. Please try again.",
        variant: "destructive"
      });
    }
  };
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 safe-top">
      <div className="container-mobile">
        <div className="flex items-center justify-between py-2">
          <h1 className="text-2xl font-bold">Versus</h1>
          <div className="flex items-center gap-2">
            <NotificationPopover notifications={notifications} onMarkAsRead={onMarkAsRead} onClearAll={onClearAll} onUserClick={onUserClick} onDeclineInvite={onDeclineInvite} />
            <Button variant="link" onClick={handleChatOpen} className="text-primary hover:bg-gray-100 rounded-full p-2" icon={<MessageCircle className="h-5 w-5" />} badge={badgeCount > 0 ? badgeCount : 0} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer">
                  <UserAvatar name={currentUser?.name || "User"} image={currentUser?.avatar} size="sm" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleViewOwnProfile}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Visit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleConnectAppleHealth}>
                  <Activity className="mr-2 h-4 w-4" />
                  <span>Track Distance</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/terms')}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Terms & Conditions</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/privacy')}>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Privacy Policy</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHelpDialogOpen(true)}>
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Help Dialog */}
      {helpDialogOpen && (
        <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
          <DialogContent
            className="sm:max-w-md"
            onEscapeKeyDown={() => setHelpDialogOpen(false)}
            onPointerDownOutside={() => setHelpDialogOpen(false)}
          >
            <DialogHeader>
              <DialogTitle>Need help?</DialogTitle>
              <DialogDescription className="sr-only">Help information</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p>For assistance, please email us at <a href="mailto:support@versus.run" className="text-primary font-medium">support@versus.run</a>.</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
export default HomeHeader;
