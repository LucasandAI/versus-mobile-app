
import { toast } from "@/hooks/use-toast";
import { User } from '@/types';
import { MAX_CLUBS_PER_USER } from '@/utils/club/clubManagement';

export const useClubValidation = () => {
  const validateClubJoin = (currentUser: User | null, clubName: string) => {
    if (!currentUser) return false;

    const userClubs = currentUser.clubs || [];
    const isAtClubCapacity = userClubs.length >= MAX_CLUBS_PER_USER;
    
    if (isAtClubCapacity) {
      toast({
        title: "Club Limit Reached",
        description: `You can join a maximum of ${MAX_CLUBS_PER_USER} clubs.`,
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const validateClubRequest = (clubName: string) => {
    toast({
      title: "Request Sent",
      description: `Your request to join ${clubName} has been sent.`,
    });
  };

  const validateExistingMembership = (isAlreadyMember: boolean, clubName: string) => {
    if (isAlreadyMember) {
      toast({
        title: "Already a Member",
        description: `You are already a member of ${clubName}.`,
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  return {
    validateClubJoin,
    validateClubRequest,
    validateExistingMembership
  };
};
