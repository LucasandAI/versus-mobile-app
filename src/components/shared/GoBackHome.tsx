
import React from 'react';
import { useApp } from '@/context/AppContext';
import Button from '@/components/shared/Button';

const GoBackHome: React.FC = () => {
  const { setCurrentView } = useApp();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">No Club Selected</h2>
        <p className="text-gray-500 mb-6">Please select a club from your home page or profile to view its details.</p>
        <Button 
          variant="primary"
          size="sm"
          onClick={() => setCurrentView('home')}
        >
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default GoBackHome;
