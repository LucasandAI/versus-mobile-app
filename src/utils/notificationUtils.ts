
import { Club } from "@/types";

export const findClubFromStorage = (clubId: string | undefined): Club | null => {
  if (!clubId) return null;
  
  try {
    const storedClubs = localStorage.getItem('clubs');
    if (!storedClubs) return null;
    
    const clubs = JSON.parse(storedClubs);
    return clubs.find((club: any) => club.id === clubId) || null;
  } catch (error) {
    console.error('Error finding club from storage:', error);
    return null;
  }
};

export const getMockClub = (clubId?: string, clubName?: string): Club | null => {
  if (!clubId || !clubName) return null;
  
  return {
    id: clubId,
    name: clubName,
    logo: '/placeholder.svg',
    division: 'bronze',
    tier: 1,
    elitePoints: 0,
    members: [],
    matchHistory: []
  };
};

export const handleClubError = () => {
  console.error('Could not find club data');
};

export const handleNotification = (notificationId: string, action: 'read' | 'delete') => {
  try {
    const storedNotifications = localStorage.getItem('notifications');
    if (!storedNotifications) return;
    
    const notifications = JSON.parse(storedNotifications);
    
    if (action === 'read') {
      const updatedNotifications = notifications.map((notification: any) => 
        notification.id === notificationId 
          ? { ...notification, read: true } 
          : notification
      );
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    } else if (action === 'delete') {
      const updatedNotifications = notifications.filter((notification: any) => 
        notification.id !== notificationId
      );
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    }
    
    // Dispatch event to notify components about the update
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Error handling notification:', error);
  }
};
