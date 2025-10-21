
import { Notification, Club } from '@/types';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Function to handle individual notification actions (read, delete)
export const handleNotification = async (id: string, action: 'read' | 'delete') => {
  try {
    console.log(`[handleNotification] Action ${action} on notification ${id}`);
    
    // Get current user to verify permissions
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[handleNotification] Error getting current user:', userError);
      return null;
    }
    
    if (action === 'read') {
      // Mark notification as read in Supabase
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', user.id);  // Add user_id check for security
        
      if (error) {
        console.error('[handleNotification] Error updating notification:', error);
        return null;
      }
    } else if (action === 'delete') {
      // Delete notification from Supabase
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);  // Add user_id check for security
        
      if (error) {
        console.error('[handleNotification] Error deleting notification:', error);
        return null;
      }
    }
    
    // Update local storage after Supabase operation succeeds
    const storedNotifications = localStorage.getItem('notifications');
    if (!storedNotifications) return null;
    
    let notifications: Notification[];
    try {
      notifications = JSON.parse(storedNotifications);
      let updatedNotifications: Notification[];
      
      if (action === 'read') {
        updatedNotifications = notifications.map(notification => 
          notification.id === id ? { ...notification, read: true } : notification
        );
        console.log(`[handleNotification] Marked notification ${id} as read`);
      } else if (action === 'delete') {
        updatedNotifications = notifications.filter(notification => notification.id !== id);
        console.log(`[handleNotification] Deleted notification ${id}`);
      } else {
        return notifications;
      }
      
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      // Dispatch event to notify components of the update
      // This is now less critical with real-time updates but still useful for non-real-time scenarios
      const event = new CustomEvent('notificationsUpdated');
      window.dispatchEvent(event);
      
      return updatedNotifications;
    } catch (error) {
      console.error(`[handleNotification] Error handling notification ${id}:`, error);
      return null;
    }
  } catch (error) {
    console.error(`[handleNotification] Error in handleNotification:`, error);
    return null;
  }
};

// Function to get notifications from storage
export const getNotificationsFromStorage = (): Notification[] => {
  try {
    const notifications = localStorage.getItem('notifications');
    const parsed = notifications ? JSON.parse(notifications) : [];
    console.log('[getNotificationsFromStorage] Notifications from storage:', parsed.length, parsed);
    return parsed;
  } catch (error) {
    console.error('[getNotificationsFromStorage] Error getting notifications from storage:', error);
    return [];
  }
};

// Function to refresh notifications (used when initializing the app)
export const refreshNotifications = async () => {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('[refreshNotifications] Error getting user:', userError);
    return [];
  }
  
  if (!user) {
    console.log('[refreshNotifications] No user found, skipping fetch');
    return [];
  }
  
  console.log('[refreshNotifications] Fetching notifications for user:', user.id);
  
  // Fetch notifications from Supabase
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      user_id,
      club_id,
      type,
      message,
      title,
      read,
      created_at,
      data,
      clubs:club_id (name, logo)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('[refreshNotifications] Error fetching notifications:', error);
    return [];
  }
  
  console.log('[refreshNotifications] Raw notifications fetched:', data.length, data);
  
  if (data.length === 0) {
    console.log('[refreshNotifications] No notifications found for user');
    localStorage.setItem('notifications', JSON.stringify([]));
    return [];
  }
  
  // Process notifications to match the expected format
  const processedNotifications: Notification[] = data.map(item => ({
    id: item.id,
    type: item.type,
    userId: item.user_id,
    clubId: item.club_id,
    clubName: item.clubs?.name || 'Unknown Club',
    clubLogo: item.clubs?.logo || null,
    title: item.title || '',
    message: item.message || '',
    timestamp: item.created_at,
    read: item.read || false,
    data: item.data || {}
  }));
  
  console.log('[refreshNotifications] Processed notifications:', JSON.stringify(processedNotifications));
  
  // Update local storage
  localStorage.setItem('notifications', JSON.stringify(processedNotifications));
  console.log('[refreshNotifications] Notifications saved to localStorage:', processedNotifications.length);
  
  // Dispatch event to update UI
  const event = new CustomEvent('notificationsUpdated');
  window.dispatchEvent(event);
  
  return processedNotifications;
};

export const markAllNotificationsAsRead = async () => {
  console.log("[markAllNotificationsAsRead] Marking all notifications as read");
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  
  // Update all pending notifications to read in Supabase
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);
    
  if (error) {
    console.error('[markAllNotificationsAsRead] Error marking notifications as read:', error);
    return [];
  }
  
  // Update local storage
  const storedNotifications = localStorage.getItem('notifications');
  if (storedNotifications) {
    try {
      const notifications: Notification[] = JSON.parse(storedNotifications);
      
      const updatedNotifications = notifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      
      const event = new CustomEvent('notificationsUpdated');
      window.dispatchEvent(event);
      
      return updatedNotifications;
    } catch (error) {
      console.error("[markAllNotificationsAsRead] Error marking all notifications as read:", error);
    }
  }
  
  return [];
};

// Function to check if a user has a pending invite for a specific club
export const hasPendingInvite = async (clubId: string, userId?: string): Promise<boolean> => {
  try {
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      userId = user.id;
    }

    console.log('[hasPendingInvite] Checking pending invite for club:', clubId, 'user:', userId);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .in('type', ['invite', 'invitation'])
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('[hasPendingInvite] No pending invite found');
        return false;
      }
      console.error('[hasPendingInvite] Error checking pending invites:', error);
      return false;
    }

    console.log('[hasPendingInvite] Found pending invite:', !!data);
    return !!data;
  } catch (error) {
    console.error('[hasPendingInvite] Error in hasPendingInvite:', error);
    return false;
  }
};

// Get find club utility functions
export const findClubFromStorage = (clubId: string | undefined): Club | null => {
  if (!clubId) return null;
  
  try {
    const storedClubs = localStorage.getItem('userClubs');
    if (!storedClubs) return null;
    
    const clubs = JSON.parse(storedClubs);
    return clubs.find((club: any) => club.id === clubId) || null;
  } catch (error) {
    console.error('[findClubFromStorage] Error finding club from storage:', error);
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
  toast({
    title: "Error",
    description: "Could not load club details",
    variant: "destructive"
  });
};
