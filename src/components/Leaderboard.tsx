
import React from 'react';
import { Trophy } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Division } from '@/types';
import AppHeader from '@/components/shared/AppHeader';
import { useClubNavigation } from '@/hooks/useClubNavigation';
import LeaderboardTable from './leaderboard/LeaderboardTable';
import LeagueSystem from './leaderboard/LeagueSystem';
import { divisions } from './leaderboard/utils';
import { useLeaderboardData } from '@/hooks/leaderboard/useLeaderboardData';
import { Skeleton } from './ui/skeleton';

const Leaderboard: React.FC = () => {
  const { currentUser } = useApp();
  const { navigateToClub } = useClubNavigation();
  const [selectedDivision, setSelectedDivision] = React.useState<Division | 'All'>('All');
  const [activeTab, setActiveTab] = React.useState<'global' | 'myClubs'>('global');
  
  const { leaderboardData, loading, error } = useLeaderboardData(selectedDivision);

  // Safely get user's club IDs, ensuring we always have an array
  const userClubs = currentUser?.clubs || [];
  const userClubIds = userClubs.map(club => club.id);
  const userClubsInLeaderboard = leaderboardData.filter(club => userClubIds.includes(club.id));

  if (error) {
    return (
      <div className="pb-20">
        <AppHeader title="Leagues" rightElement={<Trophy className="h-5 w-5" />} />
        <div className="container-mobile pt-4">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <h3 className="font-medium mb-2">Error Loading Leaderboard</h3>
            <p className="text-gray-500 text-sm mb-4">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      <AppHeader
        title="Leagues"
        rightElement={<Trophy className="h-5 w-5" />}
      />

      <div className="container-mobile pt-4">
        <div className="flex border-b mb-4">
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'global' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('global')}
          >
            Global Rankings
          </button>
          <button
            className={`py-2 px-4 font-medium text-sm ${activeTab === 'myClubs' ? 'text-primary border-b-2 border-primary' : 'text-gray-500'}`}
            onClick={() => setActiveTab('myClubs')}
          >
            My Clubs
          </button>
        </div>

        {activeTab === 'myClubs' && (
          <>
            {loading ? (
              <div className="space-y-4 mb-6">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : userClubsInLeaderboard.length > 0 ? (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">My Clubs Rankings</h2>
                <LeaderboardTable
                  clubs={userClubsInLeaderboard}
                  onSelectClub={navigateToClub}
                />
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center mb-6">
                <h3 className="font-medium mb-2">No Clubs in Rankings</h3>
                <p className="text-gray-500 text-sm mb-4">
                  Join or create a club to see your rankings here
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'global' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Top Leagues</h2>
              <div className="relative">
                <select
                  value={selectedDivision}
                  onChange={(e) => setSelectedDivision(e.target.value as Division | 'All')}
                  className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="All">All Leagues</option>
                  {divisions.map((league) => (
                    <option key={league} value={league}>
                      {league}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4 4 4-4" />
                  </svg>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <LeaderboardTable
                clubs={leaderboardData}
                onSelectClub={navigateToClub}
              />
            )}
          </>
        )}

        <LeagueSystem />
      </div>
    </div>
  );
};

export default Leaderboard;
