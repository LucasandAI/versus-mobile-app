
import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from "@/components/ui/skeleton";
import { formatLeague } from '@/utils/club/leagueUtils';
import { Division } from '@/types';

interface UserStatsProps {
  loading: boolean;
  weeklyDistance: number;
  bestLeague: string;
  bestLeagueTier: number;
}

const UserStats: React.FC<UserStatsProps> = ({
  loading,
  weeklyDistance,
  bestLeague,
  bestLeagueTier
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 w-full mt-4">
      <div className="bg-gray-50 p-4 text-center rounded-lg">
        <p className="text-xl font-bold">
          {loading ? <Skeleton className="h-6 w-16 mx-auto" /> : `${weeklyDistance} km`}
        </p>
        <p className="text-gray-500 text-sm">Weekly Contribution</p>
      </div>
      <div className="bg-gray-50 p-4 text-center rounded-lg">
        <p className="text-xl font-bold">
          {loading ? <Skeleton className="h-6 w-16 mx-auto" /> : formatLeague(bestLeague as Division, bestLeagueTier)}
        </p>
        <p className="text-gray-500 text-sm">Best League</p>
      </div>
    </div>
  );
};

export default UserStats;
