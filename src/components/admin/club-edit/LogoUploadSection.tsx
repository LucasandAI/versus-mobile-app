
import { Upload } from 'lucide-react';

interface LogoUploadSectionProps {
  logoPreview: string;
  name: string;
  onLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const LogoUploadSection = ({ 
  logoPreview, 
  name, 
  onLogoChange,
  disabled 
}: LogoUploadSectionProps) => {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <img 
          src={logoPreview} 
          alt={name} 
          className="h-24 w-24 rounded-full object-cover border"
        />
        <label 
          htmlFor="logo-upload" 
          className="absolute bottom-0 right-0 bg-primary text-white p-1.5 rounded-full cursor-pointer shadow-md"
        >
          <Upload className="h-4 w-4" />
          <span className="sr-only">Upload logo</span>
        </label>
        <input 
          id="logo-upload" 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={onLogoChange}
          disabled={disabled}
        />
      </div>
      <p className="text-xs text-gray-500">Click the icon to upload a new logo</p>
    </div>
  );
};

export default LogoUploadSection;
