import type { Availability } from './Availability';

export interface StudentRequestVolunteer {
  volUID: string;
  name: string;
  rating: number;
  skills: string[];
  categories: string[];
  supportMode: 'Physical' | 'Virtual';
  availability: Availability[];
}
