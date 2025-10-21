
import React from 'react';
import Button from '@/components/shared/Button';

interface NoUserStateProps {
  onBackHome: () => void;
}

const NoUserState: React.FC<NoUserStateProps> = ({ onBackHome }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">User Profile Not Found</h2>
        <p className="text-gray-500 mb-6">The user profile you're looking for could not be loaded.</p>
        <Button
          variant="primary"
          size="sm"
          onClick={onBackHome}
        >
          Return Home
        </Button>
      </div>
    </div>
  );
};

export default NoUserState;
