
import React from 'react';
import { Share2 } from 'lucide-react';
import { User } from '@/types';
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel } from "@/components/ui/dropdown-menu";

interface SocialLinksDropdownProps {
  user: User;
  onShareProfile: () => void;
}

const SocialLinksDropdown: React.FC<SocialLinksDropdownProps> = ({ user, onShareProfile }) => {
  const handleSocialLink = (platform: string, username: string) => {
    if (!username) {
      toast({
        title: "No Profile Link",
        description: `No ${platform} profile has been added yet.`,
      });
      return;
    }

    let url = '';
    switch(platform) {
      case 'instagram':
        url = `https://instagram.com/${username}`;
        break;
      case 'twitter':
        url = `https://twitter.com/${username}`;
        break;
      case 'facebook': 
        url = username.startsWith('http') ? username : `https://${username}`;
        break;
      case 'linkedin':
        url = username.startsWith('http') ? username : `https://${username}`;
        break;
      case 'website':
        url = username.startsWith('http') ? username : `https://${username}`;
        break;
      case 'tiktok':
        url = `https://tiktok.com/@${username}`;
        break;
      default:
        url = username;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-full">
                <Share2 className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            Social Links
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Connect with {user.name}</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => handleSocialLink('instagram', user?.instagram || '')}>
          Instagram
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('twitter', user?.twitter || '')}>
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('facebook', user?.facebook || '')}>
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('linkedin', user?.linkedin || '')}>
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('tiktok', user?.tiktok || '')}>
          TikTok
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSocialLink('website', user?.website || '')}>
          Website
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SocialLinksDropdown;
