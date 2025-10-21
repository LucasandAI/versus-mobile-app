
import { safeSupabase } from '@/integrations/supabase/safeClient';

export const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
  try {
    console.log('[uploadAvatar] Starting upload for user:', userId);
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Ensure the avatars bucket exists
    try {
      const { data: buckets } = await safeSupabase.storage.listBuckets();
      if (!buckets?.find(bucket => bucket.name === 'avatars')) {
        console.log('[uploadAvatar] Creating avatars bucket');
        await safeSupabase.storage.createBucket('avatars', { public: true });
      }
    } catch (error) {
      console.error('[uploadAvatar] Error checking/creating avatars bucket:', error);
    }

    console.log('[uploadAvatar] Uploading file to path:', filePath);
    const { error: uploadError } = await safeSupabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error('[uploadAvatar] Error uploading avatar:', uploadError);
      return null;
    }

    // Get public URL using getPublicUrl properly
    const { data } = safeSupabase.storage.from('avatars').getPublicUrl(filePath);
    console.log('[uploadAvatar] Avatar upload successful, URL:', data.publicUrl);
    
    return data.publicUrl;
  } catch (error) {
    console.error('[uploadAvatar] Error in avatar upload process:', error);
    return null;
  }
};
