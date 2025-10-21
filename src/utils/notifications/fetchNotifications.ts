
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types';
import { toast } from '@/hooks/use-toast';

// Function to fetch notifications for a user
export const fetchUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    console.log('[fetchNotifications] Fetching notifications for user:', userId);
    
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        club_id,
        type,
        title,
        message,
        read,
        created_at,
        data,
        clubs:club_id (name, logo)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('[fetchNotifications] Error fetching notifications:', error);
      return [];
    }
    
    console.log('[fetchNotifications] Raw notifications fetched:', data?.length || 0, data);
    
    // Process the notifications into the expected format
    const processedNotifications = data?.map(item => ({
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
    })) || [];
    
    console.log('[fetchNotifications] Processed notifications:', processedNotifications.length, processedNotifications);
    return processedNotifications;
  } catch (error) {
    console.error('[fetchNotifications] Error in fetchUserNotifications:', error);
    toast({
      title: "Error",
      description: "Failed to fetch notifications",
      variant: "destructive"
    });
    return [];
  }
};
