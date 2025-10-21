import React, { useState, useEffect } from 'react';
import { Search, X, UserPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatLeagueWithTier } from '@/lib/format';
import UserAvatar from '../shared/UserAvatar';
import { useNavigation } from '@/hooks/useNavigation';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

interface SearchClubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: any[];
  onRequestJoin: (clubId: string, clubName: string) => void;
}

const SearchClubDialog: React.FC<SearchClubDialogProps> = ({
  open,
  onOpenChange,
  clubs,
  onRequestJoin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { navigateToClubDetail } = useNavigation();
  const { currentUser } = useApp();
  const [pendingRequests, setPendingRequests] = useState<Record<string, boolean>>({});
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (open) {
      // Initialize member counts from the clubs prop
      const initialCounts: Record<string, number> = {};
      clubs.forEach(club => {
        initialCounts[club.id] = club.members;
      });
      setMemberCounts(initialCounts);
      
      if (currentUser) {
        fetchPendingRequests();
        fetchLatestMemberCounts();
      }
    }
  }, [open, currentUser, clubs]);

  const fetchLatestMemberCounts = async () => {
    if (!clubs.length) return;
    
    try {
      const clubIds = clubs.map(club => club.id);
      const { data, error } = await supabase
        .from('clubs')
        .select('id, member_count')
        .in('id', clubIds);
        
      if (error) {
        console.error('[SearchClubDialog] Error fetching member counts:', error);
        return;
      }
      
      if (data && Array.isArray(data)) {
        const newCounts: Record<string, number> = {};
        data.forEach(club => {
          newCounts[club.id] = club.member_count;
        });
        
        setMemberCounts(prev => ({
          ...prev,
          ...newCounts
        }));
        
        console.log('[SearchClubDialog] Updated member counts:', newCounts);
      }
    } catch (err) {
      console.error('[SearchClubDialog] Error fetching member counts:', err);
    }
  };

  const fetchPendingRequests = async () => {
    if (!currentUser) return;
    
    try {
      const { data, error } = await supabase
        .from('club_requests')
        .select('club_id')
        .eq('user_id', currentUser.id);
        
      if (error) {
        console.error('Error fetching pending requests:', error);
        return;
      }

      const requests: Record<string, boolean> = {};
      data?.forEach(request => {
        requests[request.club_id] = true;
      });
      
      setPendingRequests(requests);
    } catch (err) {
      console.error('Error processing pending requests:', err);
    }
  };
  
  const filteredClubs = clubs.filter(club => 
    club.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClubClick = (club: any) => {
    navigateToClubDetail(club.id, {
      id: club.id,
      name: club.name,
      division: club.division,
      tier: club.tier,
      logo: club.logo || '/placeholder.svg',
    });
    onOpenChange(false);
  };

  const handleRequestClick = (e: React.MouseEvent, clubId: string, clubName: string) => {
    e.stopPropagation();
    onRequestJoin(clubId, clubName);
    
    // Update the local state to reflect the change immediately
    if (pendingRequests[clubId]) {
      setPendingRequests(prev => ({
        ...prev,
        [clubId]: false
      }));
    } else {
      setPendingRequests(prev => ({
        ...prev,
        [clubId]: true
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Clubs</DialogTitle>
        </DialogHeader>
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for clubs..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Results</h3>
            
            {filteredClubs.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredClubs.map((club) => {
                  // Use the updated member count from our state, or fall back to the prop value
                  const currentMemberCount = memberCounts[club.id] !== undefined ? memberCounts[club.id] : club.members;
                  
                  return (
                    <div 
                      key={club.id} 
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                      onClick={() => handleClubClick(club)}
                    >
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          name={club.name}
                          image={club.logo}
                          size="sm"
                          className="h-10 w-10"
                        />
                        <div>
                          <h4 className="font-medium text-sm">{club.name}</h4>
                          <span className="text-xs text-gray-500">
                            {formatLeagueWithTier(club.division, club.tier)} • {currentMemberCount}/5 members
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`h-8 ${pendingRequests[club.id] ? "text-red-500 hover:text-red-700" : ""}`}
                        onClick={(e) => handleRequestClick(e, club.id, club.name)}
                      >
                        {pendingRequests[club.id] ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Cancel Request
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Request
                          </>
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center p-4 text-gray-500">
                No clubs found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchClubDialog;
