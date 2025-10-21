

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }
  
  // Navigation icons
  export const Home: FC<IconProps>;
  export const User: FC<IconProps>;
  export const Users: FC<IconProps>;
  export const UsersRound: FC<IconProps>;
  export const MessageSquare: FC<IconProps>;
  export const MessageCircle: FC<IconProps>;
  export const ArrowLeft: FC<IconProps>;
  export const ArrowRight: FC<IconProps>;
  export const ArrowUp: FC<IconProps>;
  export const ArrowDown: FC<IconProps>;
  export const RefreshCw: FC<IconProps>;
  export const RefreshCcw: FC<IconProps>;
  export const RotateCw: FC<IconProps>;
  export const RotateCcw: FC<IconProps>;
  export const ChevronDown: FC<IconProps>;
  export const ChevronUp: FC<IconProps>;
  export const ChevronLeft: FC<IconProps>;
  export const ChevronRight: FC<IconProps>;
  export const Search: FC<IconProps>;
  
  // Common UI icons
  export const Check: FC<IconProps>;
  export const X: FC<IconProps>;
  export const Circle: FC<IconProps>;
  export const Dot: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const Minus: FC<IconProps>;
  export const Trash: FC<IconProps>;
  export const Trash2: FC<IconProps>; // Added
  export const MoreHorizontal: FC<IconProps>;
  export const Edit: FC<IconProps>;
  export const PanelLeft: FC<IconProps>;
  
  // User management
  export const UserCog: FC<IconProps>;
  export const UserMinus: FC<IconProps>;
  export const UserPlus: FC<IconProps>;
  export const UserX: FC<IconProps>; // Added
  
  // Media icons
  export const Image: FC<IconProps>;
  export const Camera: FC<IconProps>;
  
  // Status/alert icons
  export const Loader: FC<IconProps>; // Added
  export const Loader2: FC<IconProps>;
  export const AlertCircle: FC<IconProps>;
  export const HelpCircle: FC<IconProps>;
  export const Flag: FC<IconProps>;
  export const Bell: FC<IconProps>;
  
  // Security/admin icons
  export const ShieldAlert: FC<IconProps>;
  export const ShieldCheck: FC<IconProps>;
  export const ShieldX: FC<IconProps>;
  export const Lock: FC<IconProps>;
  export const LogOut: FC<IconProps>;

  // Form icons
  export const Save: FC<IconProps>;
  export const Upload: FC<IconProps>;
  export const Send: FC<IconProps>;
  export const GripVertical: FC<IconProps>;
  
  // Misc icons
  export const Calendar: FC<IconProps>;
  export const Clock: FC<IconProps>;
  export const Trophy: FC<IconProps>;
  export const Crown: FC<IconProps>;
  export const Diamond: FC<IconProps>;
  export const Badge: FC<IconProps>;
  export const Flame: FC<IconProps>;
  export const Award: FC<IconProps>;
  export const Settings: FC<IconProps>;
  export const Share2: FC<IconProps>;
  export const SearchIcon: FC<IconProps>; // Added
  export const InfoIcon: FC<IconProps>; // Added
  export const Watch: FC<IconProps>; // Added
  export const Activity: FC<IconProps>; // Added for activity/running tracking
  
  // Social media
  export const Instagram: FC<IconProps>;
  export const Twitter: FC<IconProps>;
  export const Facebook: FC<IconProps>;
  export const Linkedin: FC<IconProps>;
  export const Globe: FC<IconProps>;
}

