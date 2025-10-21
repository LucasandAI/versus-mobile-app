
import React from 'react';
import { Club } from '@/types';
import MemberActions from './MemberActions';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MembersManagementProps {
  club: Club;
  onMakeAdmin: (memberId: string, memberName: string) => void;
  onRemoveMember: (memberId: string, memberName: string) => void;
}

const MembersManagement: React.FC<MembersManagementProps> = ({
  club,
  onMakeAdmin,
  onRemoveMember
}) => {
  const handleMakeAdmin = async (memberId: string, memberName: string) => {
    try {
      // Update the member's admin status in Supabase
      const { error } = await supabase
        .from('club_members')
        .update({ is_admin: true })
        .eq('club_id', club.id)
        .eq('user_id', memberId);
      
      if (error) {
        throw new Error(`Failed to make member an admin: ${error.message}`);
      }
      
      // If successful, call the parent handler to update UI
      onMakeAdmin(memberId, memberName);
      
      toast({
        title: "Admin Rights Granted",
        description: `${memberName} is now an admin of the club.`
      });
      
    } catch (error) {
      console.error('Error updating club member admin status:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update admin status",
        variant: "destructive"
      });
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    try {
      // First attempt to delete the member from Supabase
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', club.id)
        .eq('user_id', memberId);
      
      if (error) {
        throw new Error(`Failed to remove member: ${error.message}`);
      }
      
      // If successful, call the parent handler to update UI
      onRemoveMember(memberId, memberName);
      
      toast({
        title: "Member Removed",
        description: `${memberName} has been removed from the club.`
      });
      
    } catch (error) {
      console.error('Error removing club member:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium mb-2">Manage Members</h3>
      <div className="space-y-2">
        {club.members.filter(member => !member.isAdmin).map(member => (
          <div key={member.id} className="flex items-center justify-between">
            <span className="text-sm">{member.name}</span>
            <MemberActions 
              memberId={member.id}
              memberName={member.name}
              onMakeAdmin={handleMakeAdmin}
              onRemove={handleRemoveMember}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MembersManagement;
