
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  rightElement
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 py-4 px-6 text-white flex items-center relative">
      <div className="flex-1 flex items-center">
        {onBack && (
          <button 
            onClick={onBack}
            className="text-white hover:bg-green-600 rounded-full p-2 transition-colors mr-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <h1 className="text-xl font-semibold absolute left-1/2 transform -translate-x-1/2">
        {title}
      </h1>
      
      <div className="flex-1 flex items-center justify-end">
        {rightElement && rightElement}
      </div>
    </div>
  );
};

export default AppHeader;
