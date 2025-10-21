import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent } from '../ui/card';
import { Crown, Diamond, Badge } from 'lucide-react';
const LeagueSystem: React.FC = () => {
  const isMobile = useIsMobile();
  return <Card className="mt-6 bg-white rounded-lg shadow-md">
      <CardContent className="p-6 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-yellow-500 h-8 w-8 flex items-center justify-center">
              <span className="text-2xl">👑</span>
            </div>
            <span className="text-xl font-bold">Elite League</span>
          </div>
          <p className="text-gray-500 pl-11">
            Point-based (+1 win, -1 loss)
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-blue-500 h-8 w-8 flex items-center justify-center">
              <span className="text-2xl">💎</span>
            </div>
            <span className="text-xl font-bold">Diamond</span>
          </div>
          <p className="text-gray-500 pl-11">
            Diamond 5 → Diamond 1
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-gray-400 h-8 w-8 flex items-center justify-center">
              <span className="text-2xl">🔷</span>
            </div>
            <span className="text-xl font-bold">Platinum</span>
          </div>
          <p className="text-gray-500 pl-11">
            Platinum 5 → Platinum 1
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-gray-400 h-8 w-8 flex items-center justify-center">
              <span className="text-2xl">🥈</span>
            </div>
            <span className="text-xl font-bold">Silver</span>
          </div>
          <p className="text-gray-500 pl-11">
            Silver 5 → Silver 1
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="text-amber-700 h-8 w-8 flex items-center justify-center">
              <span className="text-2xl">🥉</span>
            </div>
            <span className="text-xl font-bold">Bronze</span>
          </div>
          <p className="text-gray-500 pl-11">
            Bronze 5 → Bronze 1
          </p>
          
        </div>
      </CardContent>
    </Card>;
};
export default LeagueSystem;