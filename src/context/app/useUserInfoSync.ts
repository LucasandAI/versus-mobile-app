
import { User } from './types';

export const updateUserInfo = (user: User | null): User | null => {
  if (!user) return user;
  
  // Create a copy of all clubs and update the current user's info in each club
  const userClubs = user.clubs || [];
  const updatedClubs = userClubs.map(club => {
    // Update members list
    const clubMembers = club.members || [];
    const updatedMembers = clubMembers.map(member => {
      if (member.id === user.id) {
        return {
          ...member,
          name: user.name,
          avatar: user.avatar
        };
      }
      return member;
    });
    
    // Update currentMatch info if it exists
    let updatedCurrentMatch = club.currentMatch;
    if (updatedCurrentMatch) {
      // Update home club members
      if (updatedCurrentMatch.homeClub.id === club.id) {
        const updatedHomeMembers = updatedCurrentMatch.homeClub.members.map(member => {
          if (member.id === user.id) {
            return {
              ...member,
              name: user.name,
              avatar: user.avatar
            };
          }
          return member;
        });
        
        updatedCurrentMatch = {
          ...updatedCurrentMatch,
          homeClub: {
            ...updatedCurrentMatch.homeClub,
            members: updatedHomeMembers
          }
        };
      }
      
      // Also check and update away club if user is there
      if (updatedCurrentMatch.awayClub.members.some(m => m.id === user.id)) {
        const updatedAwayMembers = updatedCurrentMatch.awayClub.members.map(member => {
          if (member.id === user.id) {
            return {
              ...member,
              name: user.name,
              avatar: user.avatar
            };
          }
          return member;
        });
        
        updatedCurrentMatch = {
          ...updatedCurrentMatch,
          awayClub: {
            ...updatedCurrentMatch.awayClub,
            members: updatedAwayMembers
          }
        };
      }
    }
    
    return {
      ...club,
      members: updatedMembers,
      currentMatch: updatedCurrentMatch
    };
  });
  
  return {
    ...user,
    clubs: updatedClubs
  };
};
