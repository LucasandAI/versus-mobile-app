
import { AppContextType, AppView, Club, User } from '@/types';

export type { AppContextType, AppView, Club, User };

// Mock user data moved from AppContext
export const mockUser: User = {
  id: '1',
  name: 'John Runner',
  avatar: '/placeholder.svg',
  clubs: [
    {
      id: '1',
      name: 'Weekend Warriors',
      logo: '/placeholder.svg',
      division: 'silver',
      tier: 2,
      elitePoints: 0,
      members: [
        { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 0 },
        { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 0 },
        { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 0 },
        { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 0 },
        { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 0 },
      ],
      matchHistory: [], // Remove mock match history
      currentMatch: {
        id: 'm1',
        homeClub: {
          id: '1',
          name: 'Weekend Warriors',
          logo: '/placeholder.svg',
          totalDistance: 62.5,
          members: [
            { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 15.3 },
            { id: '2', name: 'Jane Sprinter', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.7 },
            { id: '3', name: 'Bob Marathon', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 12.5 },
            { id: '4', name: 'Emma Jogger', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.2 },
            { id: '5', name: 'Tom Walker', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 10.8 },
          ]
        },
        awayClub: {
          id: '3',
          name: 'Running Rebels',
          logo: '/placeholder.svg',
          totalDistance: 57.2,
          members: [
            { id: '6', name: 'Sarah Swift', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 12.8 },
            { id: '7', name: 'Mike Miler', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.4 },
            { id: '8', name: 'Lisa Long', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.0 },
            { id: '9', name: 'David Dash', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 10.5 },
            { id: '10', name: 'Kate Speed', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 11.5 },
          ]
        },
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      }
    },
    {
      id: '2',
      name: 'Road Runners',
      logo: '/placeholder.svg',
      division: 'gold',
      tier: 1,
      elitePoints: 0,
      members: [
        { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 0 },
        { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 0 },
        { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 0 },
        { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 0 },
        { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 0 },
      ],
      matchHistory: [], // Remove mock match history
      currentMatch: {
        id: 'm2',
        homeClub: {
          id: '2',
          name: 'Road Runners',
          logo: '/placeholder.svg',
          totalDistance: 78.3,
          members: [
            { id: '1', name: 'John Runner', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 18.1 },
            { id: '7', name: 'Alice Sprint', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 15.4 },
            { id: '8', name: 'Charlie Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.8 },
            { id: '11', name: 'Olivia Pace', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 14.2 },
            { id: '12', name: 'Paul Path', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 13.8 },
          ]
        },
        awayClub: {
          id: '4',
          name: 'Trail Blazers',
          logo: '/placeholder.svg',
          totalDistance: 85.1,
          members: [
            { id: '13', name: 'Mark Move', avatar: '/placeholder.svg', isAdmin: true, distanceContribution: 18.3 },
            { id: '14', name: 'Eva Exercise', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.5 },
            { id: '15', name: 'Tom Track', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 17.3 },
            { id: '16', name: 'Susan Step', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.2 },
            { id: '17', name: 'Robert Run', avatar: '/placeholder.svg', isAdmin: false, distanceContribution: 16.8 },
          ]
        },
        startDate: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      }
    }
  ],
  bio: '',
  instagram: '',
  twitter: '',
  facebook: '',
  linkedin: '',
  website: '',
  tiktok: ''
};
