
import React from 'react';
import { HelpCircle, MessageSquare, AlertCircle, Flag } from 'lucide-react';

export interface SupportOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const supportOptions: SupportOption[] = [
  {
    id: 'contact',
    label: 'Contact Support',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Get help with a general question or issue'
  },
  {
    id: 'bug',
    label: 'Report a Bug',
    icon: <AlertCircle className="h-4 w-4" />,
    description: "Tell us if something isn't working correctly"
  },
  {
    id: 'report',
    label: 'Report a Cheater',
    icon: <Flag className="h-4 w-4" />,
    description: 'Report suspicious activities or cheating'
  }
];

interface SupportOptionsListProps {
  onOptionClick: (option: SupportOption) => void;
}

const SupportOptionsList: React.FC<SupportOptionsListProps> = ({ onOptionClick }) => {
  return (
    <div className="p-2">
      {supportOptions.map((option) => (
        <button
          key={option.id}
          className="w-full text-left flex items-center gap-2 py-2 px-3 hover:bg-gray-100 rounded-md"
          onClick={() => onOptionClick(option)}
        >
          <span className="flex-shrink-0 text-gray-500">{option.icon}</span>
          <div>
            <p className="text-sm font-medium">{option.label}</p>
            <p className="text-xs text-gray-500">{option.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
};

export { supportOptions, SupportOptionsList };
