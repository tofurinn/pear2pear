import type { Support_Request } from '../../../types/Support_Request';
import { hourToSlot, slotToHour } from '../student-utils.tsx';

// ─── Form types ────────────────────────────────────────────────────────────────

export type SupportMode = 'Physical' | 'Virtual';

// Combined form data across all steps
export interface RequestFormData {
  // Step 1: Support Type
  category: Support_Request['category'] | '';
  title: string;
  description: string;
  // Step 2: Filtering
  supportMode: SupportMode;
  requiredSkills: string[];
  // Step 3: Availability Filtering
  availability: string[];     // recurring weekday slot keys: 'weekday:HH:00'
  // Step 4: Volunteer Match-making
  volUID: string;
}

// ─── Date / time helpers ───────────────────────────────────────────────────────

export const weekdaySlotKey = (weekday: number, hour: number) => `${weekday}:${hourToSlot(hour)}`;
export const parseWeekdaySlotKey = (key: string) => {
  const separator = key.indexOf(':');
  return {
    weekday: Number(key.slice(0, separator)),
    hour: slotToHour(key.slice(separator + 1)),
  };
};

// ─── Form defaults ─────────────────────────────────────────────────────────────

// A function (not a constant) so the default dates are fresh each time the form starts over
export const createEmptyForm = (): RequestFormData => {
  return {
    category: '',
    title: '',
    description: '',
    supportMode: 'Physical',
    requiredSkills: [],
    availability: [],
    volUID: '',
  };
};

// ─── Option lists (replace with Firebase / API later) ──────────────────────────

export const CATEGORIES: Support_Request['category'][] = [
  'General Student Support',
  'Academic Support',
  'Technology Support',
  'New Student Support',
];

export const SKILLS = [
  'High Achiever', 'Tech Wiz', 'Patience', 'Cooking', 'Friendly',
  'Smart', 'Academically Gifted', 'Creative', 'Organised',
];

// ─── Mock volunteers (replace with Firebase / API later) ───────────────────────

export interface Volunteer {
  volUID: string;
  name: string;
  rating: number;
  ratingCount: number;
  tags: string[];          // skills
  categories: string[];    // support categories they offer
}

export const MOCK_VOLUNTEERS: Volunteer[] = [
  { volUID: 'vol-1', name: 'Aisha Rahman', rating: 4.5, ratingCount: 10, tags: ['Tech Wiz', 'Patience', 'Cooking', 'Friendly'], categories: ['General Student Support', 'Technology Support'] },
  { volUID: 'vol-2', name: 'Daniel Lim', rating: 4.0, ratingCount: 2, tags: ['High Achiever', 'Patience', 'Cooking', 'Friendly'], categories: ['General Student Support', 'Academic Support'] },
  { volUID: 'vol-3', name: 'Priya Nair', rating: 4.5, ratingCount: 20, tags: ['High Achiever', 'Cooking', 'Friendly'], categories: ['General Student Support', 'New Student Support'] },
  { volUID: 'vol-4', name: 'Hafiz Ismail', rating: 4.5, ratingCount: 157, tags: ['Tech Wiz', 'Friendly'], categories: ['Technology Support', 'New Student Support'] },
  { volUID: 'vol-5', name: 'Mei Ling Tan', rating: 4.8, ratingCount: 31, tags: ['Smart', 'Academically Gifted', 'Patience'], categories: ['Academic Support'] },
  { volUID: 'vol-6', name: 'Arjun Menon', rating: 4.2, ratingCount: 8, tags: ['Creative', 'Organised', 'Friendly', 'Cooking'], categories: ['General Student Support', 'New Student Support'] },
  { volUID: 'vol-7', name: 'Siti Aminah', rating: 4.7, ratingCount: 44, tags: ['Tech Wiz', 'Smart', 'Patience'], categories: ['Technology Support', 'Academic Support'] },
  { volUID: 'vol-8', name: 'Jason Wong', rating: 3.9, ratingCount: 5, tags: ['Organised', 'High Achiever', 'Friendly'], categories: ['General Student Support', 'Academic Support', 'New Student Support'] },
];

// Hours the volunteer is free, per weekday (JS getDay(): 0 = Sunday ... 6 = Saturday).
// Recurring weekly availability: later this comes from the volunteer's Firestore data.
export const getAvailability = (volUID: string): Record<number, number[]> => {
  const n = Number(volUID.replace('vol-', ''));
  const hours =
    n % 3 === 0 ? [16, 17, 18, 19, 20] : n % 2 === 0 ? [10, 11, 12, 13, 14] : [12, 13, 14, 15, 16, 17];
  return { 0: hours, 1: hours, 2: hours, 3: hours, 4: hours, 5: hours, 6: hours };
};

// ─── Matching (step 4) ─────────────────────────────────────────────────────────

export interface VolunteerMatch extends Volunteer {
  overlap: number; // how many of the student's chosen slots the volunteer can cover
}

type MatchCriteria = Pick<RequestFormData, 'category' | 'requiredSkills' | 'availability'>;

// A volunteer matches when they offer the category, have ALL the required skills,
// and are free for at least one of the chosen slots. Best overlap first, then rating.
export const matchVolunteers = (criteria: MatchCriteria): VolunteerMatch[] =>
  MOCK_VOLUNTEERS
    .filter(v => v.categories.includes(criteria.category))
    .filter(v => criteria.requiredSkills.every(skill => v.tags.includes(skill)))
    .map(v => {
      const free = getAvailability(v.volUID);
      const overlap = criteria.availability.filter(key => {
        const { weekday, hour } = parseWeekdaySlotKey(key);
        return free[weekday]?.includes(hour);
      }).length;
      return { ...v, overlap };
    })
    .filter(v => v.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.rating - a.rating);

// ─── Summary for the confirmation page ─────────────────────────────────────────

export interface RequestSummary {
  category: Support_Request['category'];
  title: string;
  description: string;
  supportMode: SupportMode;
  slotCount: number;
  volunteer: Volunteer;
}

export const buildSummary = (data: RequestFormData): RequestSummary | null => {
  const volunteer = MOCK_VOLUNTEERS.find(v => v.volUID === data.volUID);
  if (!volunteer || !data.category) return null;

  return {
    category: data.category,
    title: data.title,
    description: data.description,
    supportMode: data.supportMode,
    slotCount: data.availability.length,
    volunteer,
  };
};