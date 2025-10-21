
import { User, Club, ClubMember } from '@/types';

export interface NavigationState {
  isLoading: boolean;
}

export interface ClubNavigationResult extends NavigationState {
  navigateToClubDetail: (clubId: string, club?: Partial<Club>) => Promise<void>;
}

export interface UserNavigationResult extends NavigationState {
  navigateToUserProfile: (userId: string, userName: string, userAvatar?: string) => Promise<void>;
}
