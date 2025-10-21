import React, { useState, useEffect, useRef } from 'react';
import { Match, Club, ClubMember } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { ChevronDown, Clock } from 'lucide-react';
import MatchProgressBar from '@/components/shared/MatchProgressBar';
import { Card, CardContent } from "@/components/ui/card";
import { useNavigation } from '@/hooks/useNavigation';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import CountdownTimer from '@/components/match/CountdownTimer';
import { getCurrentCycleInfo } from '@/utils/date/matchTiming';
import { formatLeague } from '@/utils/club/leagueUtils';
import { debounce } from 'lodash';
interface MatchDisplayProps {
  match: Match;
  userClub: Club | null;
  onViewProfile: (userId: string, name: string, avatar?: string) => void;
  forceShowDetails?: boolean;
}
const MatchDisplay: React.FC<MatchDisplayProps> = ({
  match,
  userClub,
  onViewProfile,
  forceShowDetails = false
}) => {
  // Ensure we have valid data to display
  if (!match || !match.homeClub || !match.awayClub) {
    console.error('[MatchDisplay] Invalid match data:', match);
    return <Card className="overflow-hidden border-0 shadow-md">
        <CardContent className="p-4">
          <div className="text-center py-4 text-gray-500">
            Match data is unavailable
          </div>
        </CardContent>
      </Card>;
  }

  // Initialize state with forceShowDetails value
  const [open, setOpen] = useState<boolean>(forceShowDetails);
  const {
    navigateToClubDetail
  } = useNavigation();
  const matchEndDateRef = useRef<Date | null>(match ? new Date(match.endDate) : null);
  const initialRenderRef = useRef<boolean>(true);

  // Determine if user club is home or away
  const isHome = userClub && match.homeClub.id === userClub.id;
  const currentClub = isHome ? match.homeClub : match.awayClub;
  const opponentClub = isHome ? match.awayClub : match.homeClub;

  // Define handler functions
  const handleMemberClick = (member: ClubMember) => {
    if (member && member.id) {
      onViewProfile(member.id, member.name || 'Unknown', member.avatar);
    }
  };
  const handleClubClick = (club: any) => {
    if (club && club.id) {
      navigateToClubDetail(club.id, {
        id: club.id,
        name: club.name || 'Unknown Club',
        logo: club.logo || '/placeholder.svg',
        members: club.members || [],
        matchHistory: []
      });
    }
  };

  // Debounce the match ended event to prevent flickering
  const debouncedDispatchMatchEnded = useRef(debounce((matchId?: string) => {
    console.log('[MatchDisplay] Dispatching debounced matchEnded event');
    window.dispatchEvent(new CustomEvent('matchEnded', {
      detail: {
        matchId
      }
    }));
  }, 500)).current;
  const handleCountdownComplete = () => {
    console.log('[MatchDisplay] Match ended, refreshing data');
    debouncedDispatchMatchEnded(match.id);
  };

  // Update match end date and open state based on forceShowDetails prop
  useEffect(() => {
    if (match) {
      const endDate = new Date(match.endDate);
      if (!matchEndDateRef.current || endDate.getTime() !== matchEndDateRef.current.getTime()) {
        matchEndDateRef.current = endDate;
      }
    }

    // Only update open state on mount or when forceShowDetails changes
    if (initialRenderRef.current || forceShowDetails !== open) {
      console.log('[MatchDisplay] Setting open state to match forceShowDetails:', forceShowDetails);
      setOpen(forceShowDetails);
      initialRenderRef.current = false;
    }
  }, [match, forceShowDetails]);
  return <Card className="overflow-hidden border-0 shadow-md">
      <CardContent className="p-4">
        {/* Match in Progress Notification */}
        <div className="p-3 rounded-md mb-4 bg-inherit">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Match in progress</h3>
            <div className="flex items-center text-amber-800 text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>Time remaining: </span>
              <CountdownTimer targetDate={matchEndDateRef.current!} className="font-mono ml-1" onComplete={handleCountdownComplete} refreshInterval={500} />
            </div>
          </div>
        </div>
        
        {/* Clubs Matchup */}
        <div className="flex justify-between items-center mb-6">
          {/* Current Club (always on left) */}
          <div className="text-center">
            <div className="flex flex-col items-center cursor-pointer" onClick={() => handleClubClick(currentClub)}>
              <UserAvatar name={currentClub.name} image={currentClub.logo} size="md" className="mb-2" />
              <h4 className="font-medium text-sm hover:text-primary transition-colors">
                {currentClub.name}
              </h4>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 mt-1">
                {currentClub.division && currentClub.tier && formatLeague(currentClub.division, currentClub.tier)}
              </span>
            </div>
          </div>
          
          <div className="text-center text-gray-500 font-medium">vs</div>
          
          {/* Opponent Club (always on right) */}
          <div className="text-center">
            <div className="flex flex-col items-center cursor-pointer" onClick={() => handleClubClick(opponentClub)}>
              <UserAvatar name={opponentClub.name} image={opponentClub.logo} size="md" className="mb-2" />
              <h4 className="font-medium text-sm hover:text-primary transition-colors">
                {opponentClub.name}
              </h4>
              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 mt-1">
                {opponentClub.division && opponentClub.tier && formatLeague(opponentClub.division, opponentClub.tier)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Match Progress Bar */}
        <MatchProgressBar homeDistance={currentClub.totalDistance} awayDistance={opponentClub.totalDistance} className="h-5" />
        
        {/* Member Contributions Toggle Button */}
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full mt-4 text-sm flex items-center justify-center bg-gray-50 hover:bg-gray-100 border-gray-200">
              {open ? 'Hide Member Contributions' : 'Show Member Contributions'} 
              <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="border-t border-gray-100 pt-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                {/* Current Club Members */}
                <div>
                  
                  <div className="space-y-3">
                    {currentClub.members && currentClub.members.length > 0 ? currentClub.members.map(member => <div key={member.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1" onClick={() => handleMemberClick(member)}>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={member.name} image={member.avatar} size="sm" />
                            <span className="text-sm hover:text-primary transition-colors">{member.name}</span>
                          </div>
                          <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                        </div>) : <div className="text-sm text-gray-500 py-2">No members found</div>}
                  </div>
                </div>
                
                {/* Opponent Club Members */}
                <div>
                  
                  <div className="space-y-3">
                    {opponentClub && opponentClub.members && opponentClub.members.length > 0 ? opponentClub.members.map(member => <div key={member.id} className="flex items-center justify-between cursor-pointer hover:bg-gray-50 rounded p-1" onClick={() => handleMemberClick(member)}>
                          <div className="flex items-center gap-2">
                            <UserAvatar name={member.name} image={member.avatar} size="sm" />
                            <span className="text-sm hover:text-primary transition-colors">{member.name}</span>
                          </div>
                          <span className="text-sm font-medium">{member.distanceContribution?.toFixed(1) || "0.0"} km</span>
                        </div>) : <div className="text-sm text-gray-500 py-2">No members found</div>}
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>;
};
export default MatchDisplay;