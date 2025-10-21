
import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface BasicInfoSectionProps {
  name: string;
  setName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  name, setName,
  bio, setBio
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
        />
      </div>
      
      <div>
        <label htmlFor="bio" className="block text-sm font-medium">
          Bio <span className="text-gray-500 text-xs italic">(optional)</span>
        </label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself"
          className="resize-none"
        />
      </div>
    </div>
  );
};

export default BasicInfoSection;
