
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Club } from '@/types';
import { LeaderboardClub } from './types';
import { getDivisionIcon, getDivisionColor, formatLeagueWithTier } from './utils';
import { useNavigation } from '@/hooks/useNavigation';

interface LeaderboardTableProps {
  clubs: LeaderboardClub[];
  onSelectClub?: (club: Partial<Club>) => void;
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ clubs, onSelectClub }) => {
  const { navigateToClubDetail } = useNavigation();
  
  const getChangeIcon = (change: 'up' | 'down' | 'same') => {
    switch (change) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-500" />;
      default:
        return <span className="h-4 w-4 text-gray-300">-</span>;
    }
  };

  const handleClubClick = (club: LeaderboardClub) => {
    // First use the navigation hook which will properly set the selected club
    navigateToClubDetail(club.id, {
      id: club.id,
      name: club.name,
      division: club.division,
      tier: club.tier,
      elitePoints: club.division === 'elite' ? club.points : 0,
      logo: '/placeholder.svg', 
      members: [],
      matchHistory: []
    });
    
    // If onSelectClub is provided, call it as well for backward compatibility
    if (onSelectClub) {
      onSelectClub({
        id: club.id,
        name: club.name,
        division: club.division,
        tier: club.tier,
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Rank
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Club
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              League
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Points
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Change
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {clubs.slice(0, 100).map((club) => (
            <tr 
              key={club.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleClubClick(club)}
            >
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {club.rank}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800 hover:text-primary">
                {club.name}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getDivisionColor(club.division)}`}>
                  {getDivisionIcon(club.division)} {formatLeagueWithTier(club.division, club.tier)}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-800">
                {club.division === 'elite' ? club.points : '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {getChangeIcon(club.change)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
