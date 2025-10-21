
import React from 'react';
import { Card } from '@/components/ui/card';
import { Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from "@/components/ui/skeleton";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Achievement {
  id: string;
  name: string;
  description: string;
  color?: string;
}

interface UserAchievementsProps {
  loading: boolean;
  isCurrentUserProfile: boolean;
  completedAchievements: Achievement[];
  inProgressAchievements: Achievement[];
  moreInProgressAchievements: Achievement[];
  showMoreAchievements: boolean;
  onToggleMoreAchievements: () => void;
}

const UserAchievements: React.FC<UserAchievementsProps> = ({
  loading,
  isCurrentUserProfile,
  completedAchievements,
  inProgressAchievements,
  moreInProgressAchievements,
  showMoreAchievements,
  onToggleMoreAchievements,
}) => {
  return (
    <Card className="w-full max-w-md mx-auto mt-4 p-6 rounded-lg">
      <div className="flex items-center mb-4">
        <Award className="text-green-500 mr-2 h-5 w-5" />
        <h3 className="text-lg font-semibold">Achievements</h3>
      </div>

      <div className="mb-6">
        <h4 className="text-sm font-medium mb-2">Completed</h4>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {loading ? (
              <>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
              </>
            ) : (
              completedAchievements.map(achievement => (
                <HoverCard key={achievement.id}>
                  <HoverCardTrigger asChild>
                    <div className="px-3 py-1 rounded-full bg-white text-green-600 text-xs flex items-center cursor-help">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      {achievement.name}
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64 p-3">
                    <h4 className="font-medium mb-1">{achievement.name}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </HoverCardContent>
                </HoverCard>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium mb-2">In Progress</h4>
        <div className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </>
          ) : (
            <>
              {inProgressAchievements.map(achievement => (
                <div key={achievement.id} className="mb-3">
                  <p className="font-medium">{achievement.name}</p>
                  <p className="text-gray-500 text-sm">{achievement.description}</p>
                </div>
              ))}
              
              {showMoreAchievements && (
                moreInProgressAchievements.map(achievement => (
                  <div key={achievement.id} className="mb-3">
                    <p className="font-medium">{achievement.name}</p>
                    <p className="text-gray-500 text-sm">{achievement.description}</p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
      
      {isCurrentUserProfile && (
        <Button 
          variant="ghost" 
          className="text-green-600 flex items-center justify-center w-full mt-4"
          onClick={onToggleMoreAchievements}
        >
          {showMoreAchievements ? (
            <>
              Show Less <ChevronUp className="h-4 w-4 ml-1" />
            </>
          ) : (
            <>
              Show More Achievements <ChevronDown className="h-4 w-4 ml-1" />
            </>
          )}
        </Button>
      )}
    </Card>
  );
};

export default UserAchievements;
