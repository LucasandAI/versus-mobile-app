
import React from "react";
import { Input } from "@/components/ui/input";
import { Instagram, Linkedin, Globe, Twitter, Facebook } from "lucide-react";

interface SocialLinksSectionProps {
  instagram: string;
  setInstagram: (value: string) => void;
  linkedin: string;
  setLinkedin: (value: string) => void;
  twitter: string;
  setTwitter: (value: string) => void;
  facebook: string;
  setFacebook: (value: string) => void;
  website: string;
  setWebsite: (value: string) => void;
  tiktok: string;
  setTiktok: (value: string) => void;
}

const SocialLinksSection: React.FC<SocialLinksSectionProps> = ({
  instagram, setInstagram,
  linkedin, setLinkedin,
  twitter, setTwitter,
  facebook, setFacebook,
  website, setWebsite,
  tiktok, setTiktok
}) => {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Social Links <span className="text-gray-500 text-xs italic">(all optional)</span></h4>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Instagram className="h-4 w-4" />
          <Input 
            placeholder="Instagram username" 
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Twitter className="h-4 w-4" />
          <Input 
            placeholder="Twitter username" 
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Facebook className="h-4 w-4" />
          <Input 
            placeholder="Facebook profile URL" 
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Linkedin className="h-4 w-4" />
          <Input 
            placeholder="LinkedIn profile URL" 
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M9 12A3 3 0 1 0 9 6a3 3 0 0 0 0 6Z" />
            <path d="M9 6v12m6-6v6m0-9v3" />
          </svg>
          <Input 
            placeholder="TikTok username" 
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <Input 
            placeholder="Website URL" 
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default SocialLinksSection;
