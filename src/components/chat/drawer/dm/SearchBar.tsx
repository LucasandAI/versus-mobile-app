
import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onClear }) => {
  return (
    <div className="relative flex items-center bg-gray-100 rounded-lg">
      <Search className="absolute left-4 h-5 w-5 text-gray-400" />
      <input
        type="text"
        className="w-full py-3 pl-12 pr-4 bg-transparent text-lg placeholder:text-gray-500 focus:outline-none"
        placeholder="Search users..."
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute right-4 text-gray-500 hover:text-gray-700"
        >
          <span className="sr-only">Clear</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default SearchBar;
