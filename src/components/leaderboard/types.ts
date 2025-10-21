
import { Division } from '@/types';

export interface LeaderboardClub {
  id: string;
  name: string;
  division: Division;
  tier?: number;
  rank: number;
  points: number;
  change: 'up' | 'down' | 'same';
}
