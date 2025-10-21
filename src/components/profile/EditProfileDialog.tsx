
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { User } from "@/types";
import AvatarSection from "./edit-profile/AvatarSection";
import BasicInfoSection from "./edit-profile/BasicInfoSection";
import SocialLinksSection from "./edit-profile/SocialLinksSection";
import { useEditProfileState } from "./edit-profile/useEditProfileState";

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
}

const EditProfileDialog = ({ open, onOpenChange, user }: EditProfileDialogProps) => {
  const isMobile = useIsMobile();

  const {
    name, setName,
    bio, setBio,
    instagram, setInstagram,
    linkedin, setLinkedin,
    twitter, setTwitter,
    facebook, setFacebook,
    website, setWebsite,
    tiktok, setTiktok,
    avatar,
    previewKey,
    isSaving,
    handleAvatarChange,
    handleSaveChanges,
  } = useEditProfileState({ user, onOpenChange });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[95vw] max-w-[95vw]' : 'sm:max-w-[425px]'}`}>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <AvatarSection
            name={name}
            avatar={avatar}
            handleAvatarChange={handleAvatarChange}
            previewKey={previewKey}
          />

          <BasicInfoSection
            name={name}
            setName={setName}
            bio={bio}
            setBio={setBio}
          />

          <SocialLinksSection
            instagram={instagram}
            setInstagram={setInstagram}
            linkedin={linkedin}
            setLinkedin={setLinkedin}
            twitter={twitter}
            setTwitter={setTwitter}
            facebook={facebook}
            setFacebook={setFacebook}
            website={website}
            setWebsite={setWebsite}
            tiktok={tiktok}
            setTiktok={setTiktok}
          />
        </div>
        <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
          <Button variant="outline" onClick={() => onOpenChange(false)} className={isMobile ? 'w-full' : ''} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveChanges}
            className={isMobile ? 'w-full' : ''}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
