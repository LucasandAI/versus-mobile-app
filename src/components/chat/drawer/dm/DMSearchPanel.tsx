
import React from 'react';
import { useUserSearch } from '@/hooks/chat/dm/useUserSearch';
import SearchBar from './SearchBar';
import UserSearchResults from './UserSearchResults';
import { ArrowLeft } from 'lucide-react';

interface DMSearchPanelProps {
  onSelect: (userId: string, userName: string, userAvatar: string) => Promise<void> | void;
  onBack: () => void;
}

const DMSearchPanel: React.FC<DMSearchPanelProps> = ({ onSelect, onBack }) => {
  const {
    query,
    setQuery,
    searchResults,
    isLoading,
    searchUsers,
    clearSearch,
    showResults,
    setShowResults
  } = useUserSearch();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    searchUsers(value);
    setShowResults(true);
  };

  const handleSelect = async (userId: string, userName: string, userAvatar: string) => {
    clearSearch();
    await onSelect(userId, userName, userAvatar);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 flex items-center space-x-3 border-b">
        <button 
          onClick={onBack}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">New Message</h1>
      </div>
      
      <div className="p-4">
        <SearchBar 
          value={query}
          onChange={handleSearchChange}
          onClear={clearSearch}
        />
      </div>
      
      <div className="relative flex-1 overflow-auto">
        <UserSearchResults 
          results={searchResults}
          isLoading={isLoading}
          onSelect={handleSelect}
          showResults={showResults && query.length > 0}
        />
        
        {!query && (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">Search for a user to start a conversation</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DMSearchPanel;
