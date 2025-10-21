
import React from "react";
import { Upload } from "lucide-react";
import UserAvatar from "@/components/shared/UserAvatar";

interface AvatarSectionProps {
  name: string;
  avatar: string;
  handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  previewKey: number;
}

const AvatarSection: React.FC<AvatarSectionProps> = ({
  name,
  avatar,
  handleAvatarChange,
  previewKey
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <UserAvatar 
          name={name || ""} 
          image={avatar}
          size="lg"
          key={`avatar-${previewKey}`}
        />
        <label 
          htmlFor="avatar-upload" 
          className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-md"
        >
          <Upload className="h-4 w-4" />
          <span className="sr-only">Upload picture</span>
        </label>
        <input 
          id="avatar-upload" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleAvatarChange}
        />
      </div>
      <div>
        <p className="text-sm text-gray-500">Click the icon to upload a new picture <span className="italic">(optional)</span></p>
      </div>
    </div>
  );
};

export default AvatarSection;
