import React, { useState, useEffect } from 'react';
import { Club } from '@/types';
import UserAvatar from '@/components/shared/UserAvatar';
import { supabase } from '@/integrations/supabase/client';

interface ClubHeaderInfoProps {
  club: Club;
  memberCount: number;
  isAdmin?: boolean;
}

const ClubHeaderInfo: React.FC<ClubHeaderInfoProps> = ({ 
  club,
  memberCount,
  isAdmin 
}) => {
  const [currentMemberCount, setCurrentMemberCount] = useState(memberCount);

  // Keep member count in sync with real-time changes
  useEffect(() => {
    setCurrentMemberCount(memberCount);
    
    // Set up listener for realtime updates to member count
    const membershipChannel = supabase
      .channel(`club-header-members-${club.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'club_members',
          filter: `club_id=eq.${club.id}`
        },
        async () => {
          console.log('[ClubHeaderInfo] Club membership changed, fetching updated count');
          
          try {
            const { data, error } = await supabase
              .from('clubs')
              .select('member_count')
              .eq('id', club.id)
              .single();
              
            if (!error && data) {
              console.log('[ClubHeaderInfo] Updated member count:', data.member_count);
              setCurrentMemberCount(data.member_count);
            }
          } catch (err) {
            console.error('[ClubHeaderInfo] Error fetching updated member count:', err);
          }
        }
      )
      .subscribe();

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(membershipChannel);
    };
  }, [club.id, memberCount]);

  return (
    <div className="flex flex-col items-center md:items-start">
      <div className="mb-4">
        <UserAvatar
          name={club.name}
          image={club.logo}
          size="lg"
        />
      </div>
      
      <div className="text-center md:text-left">
        <h1 className="text-2xl font-bold mb-2">{club.name}</h1>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            {currentMemberCount}/5 members
          </span>
        </div>
      </div>
    </div>
  );
};

export default ClubHeaderInfo;
