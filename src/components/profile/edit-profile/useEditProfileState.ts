
import { useState, useEffect } from "react";
import { User } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useApp } from "@/context/AppContext";
import { uploadAvatar } from "./uploadAvatar";

interface UseEditProfileStateProps {
  user: User | null;
  onOpenChange: (o: boolean) => void;
}

export const useEditProfileState = ({ user, onOpenChange }: UseEditProfileStateProps) => {
  const { setCurrentUser, setSelectedUser, refreshCurrentUser } = useApp();
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "Versus Athlete");
  const [instagram, setInstagram] = useState(user?.instagram || "");
  const [linkedin, setLinkedin] = useState(user?.linkedin || "");
  const [twitter, setTwitter] = useState(user?.twitter || "");
  const [facebook, setFacebook] = useState(user?.facebook || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [tiktok, setTiktok] = useState(user?.tiktok || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [isSaving, setIsSaving] = useState(false);
  // Add a flag to track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Only set form values from user data on initial load or when user changes
  useEffect(() => {
    if (user && !initialDataLoaded) {
      console.log('[useEditProfileState] Setting initial data from user:', user.id);
      console.log('[useEditProfileState] Avatar URL:', user.avatar);
      setName(user.name || "");
      setBio(user.bio || "Versus Athlete");
      setInstagram(user.instagram || "");
      setTwitter(user.twitter || "");
      setFacebook(user.facebook || "");
      setLinkedin(user.linkedin || "");
      setWebsite(user.website || "");
      setTiktok(user.tiktok || "");
      setAvatar(user.avatar || "");
      setAvatarFile(null);
      setPreviewKey(Date.now());
      setInitialDataLoaded(true);
    }
  }, [user, initialDataLoaded]);

  // Reset form data when dialog opens with a different user
  useEffect(() => {
    if (user) {
      setInitialDataLoaded(false);
    }
  }, [user?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      console.log('[useEditProfileState] Local preview URL created:', previewUrl);
      setAvatar(previewUrl);
      setAvatarFile(file);
      setPreviewKey(Date.now());
    }
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return false;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "No user found to update",
        variant: "destructive",
      });
      return false;
    }

    setIsSaving(true);

    try {
      let avatarUrl = user.avatar; // Start with current avatar

      if (avatarFile) {
        console.log('[useEditProfileState] Uploading new avatar file');
        const uploadedUrl = await uploadAvatar(user.id, avatarFile);
        if (uploadedUrl) {
          console.log('[useEditProfileState] New avatar URL:', uploadedUrl);
          avatarUrl = uploadedUrl;
        } else {
          toast({
            title: "Warning",
            description: "Failed to upload new avatar, keeping existing one",
            variant: "destructive",
          });
        }
      }

      const { safeSupabase } = await import('@/integrations/supabase/safeClient');
      console.log('[useEditProfileState] Updating user profile with avatar:', avatarUrl);
      
      const { error } = await safeSupabase
        .from('users')
        .update({
          name,
          bio,
          instagram,
          twitter,
          facebook,
          linkedin,
          website,
          tiktok,
          avatar: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // Update local state first with the new data
      const updatedUser = {
        ...user,
        name,
        bio,
        instagram,
        linkedin,
        twitter,
        facebook,
        website,
        tiktok,
        avatar: avatarUrl
      };

      // Update current user and selected user states
      setCurrentUser(updatedUser);
      setSelectedUser(updatedUser);

      // Then refresh from the database to ensure everything is in sync
      console.log('[useEditProfileState] Refreshing user data from database');
      await refreshCurrentUser();
      
      // Trigger a refresh event for any components listening
      window.dispatchEvent(new CustomEvent('userDataUpdated'));

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      onOpenChange(false);
      return true;
    } catch (error) {
      console.error('[useEditProfileState] Error updating profile:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your profile. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    name, setName,
    bio, setBio,
    instagram, setInstagram,
    linkedin, setLinkedin,
    twitter, setTwitter,
    facebook, setFacebook,
    website, setWebsite,
    tiktok, setTiktok,
    avatar, setAvatar,
    avatarFile, setAvatarFile,
    previewKey,
    isSaving,
    handleAvatarChange,
    handleSaveChanges,
  };
};
