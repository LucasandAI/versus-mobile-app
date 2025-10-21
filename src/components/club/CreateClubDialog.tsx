
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from '@/integrations/supabase/client';

interface CreateClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateClubDialog = ({ open, onOpenChange }: CreateClubDialogProps) => {
  const { createClub, currentUser } = useApp();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  const validateClubName = async (clubName: string) => {
    if (!clubName.trim()) {
      setNameError("Club name is required");
      return false;
    }
    
    if (clubName.trim().length < 3) {
      setNameError("Club name must be at least 3 characters long");
      return false;
    }
    
    if (clubName.trim().length > 50) {
      setNameError("Club name must be less than 50 characters");
      return false;
    }
    
    setNameError(null);
    return true;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (nameError && value.trim()) {
      validateClubName(value);
    }
  };

  const handleLogoUpload = async (file: File): Promise<string | null> => {
    if (!currentUser) return null;
    
    try {
      console.log('[CreateClubDialog] Starting logo upload');
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}-club-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('club-logos')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('[CreateClubDialog] Logo upload error:', uploadError);
        throw uploadError;
      }
      
      const { data } = supabase.storage.from('club-logos').getPublicUrl(filePath);
      console.log('[CreateClubDialog] Logo uploaded successfully:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('[CreateClubDialog] Error uploading logo:', error);
      return null;
    }
  };

  const handleCreateClub = async () => {
    const isValidName = await validateClubName(name);
    if (!isValidName) {
      return;
    }

    setIsCreating(true);

    try {
      let logoUrl = image;
      
      // If there's a new image file, upload it
      if (imageFile) {
        logoUrl = await handleLogoUpload(imageFile);
        if (!logoUrl) {
          throw new Error('Failed to upload club logo');
        }
      }

      console.log('[CreateClubDialog] Creating club with name:', name, 'and logo:', logoUrl);
      
      // Ensure we're passing parameters that match the function signature
      const result = await createClub(name.trim(), logoUrl || '/placeholder.svg');
      
      if (result) {
        toast({
          title: "Success",
          description: `Your club "${name}" has been created`,
        });
        
        // Reset form
        setName("");
        setBio("");
        setImage(null);
        setImageFile(null);
        setNameError(null);
        onOpenChange(false);
      }
      // Don't throw error if result is null - createClub already shows the specific error message
    } catch (error) {
      console.error('[CreateClubDialog] Error creating club:', error);
      toast({
        title: "Error creating club",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Club</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div 
              className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
              onClick={() => document.getElementById('club-image')?.click()}
            >
              {image ? (
                <img 
                  src={image} 
                  alt="Club" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <Camera className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <input
              id="club-image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageSelect(file);
                }
              }}
            />
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => document.getElementById('club-image')?.click()}
            >
              Upload Picture
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Club Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Enter club name"
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && (
              <p className="text-sm text-red-500">{nameError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Club Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your club"
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreateClub} disabled={isCreating || !!nameError}>
            {isCreating ? 'Creating...' : 'Create Club'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClubDialog;
