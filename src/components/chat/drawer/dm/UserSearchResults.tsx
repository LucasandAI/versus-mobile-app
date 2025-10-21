
import React from 'react';
import UserAvatar from '@/components/shared/UserAvatar';

interface SearchResult {
  id: string;
  name: string;
  avatar: string;
}

interface UserSearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  onSelect: (userId: string, userName: string, userAvatar: string) => void;
  showResults: boolean;
}

const UserSearchResults: React.FC<UserSearchResultsProps> = ({
  results,
  isLoading,
  onSelect,
  showResults,
}) => {
  if (!showResults) return null;

  const handleUserSelect = (user: SearchResult) => {
    onSelect(user.id, user.name, user.avatar);
  };

  if (isLoading) {
    return (
      <div className="absolute z-10 w-full bg-white border-x border-b rounded-b-lg shadow-lg">
        <div className="p-4 text-center text-gray-500">Searching...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {results.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No users found
        </div>
      ) : (
        <div className="py-2">
          {results.map((user) => (
            <div
              key={user.id}
              onClick={() => handleUserSelect(user)}
              className="px-4 py-2 hover:bg-gray-50 flex items-center cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={user.name}
                  image={user.avatar}
                  size="sm"
                />
                <span className="font-medium">{user.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSearchResults;
