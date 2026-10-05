import type { Support_Request } from '../../../types/Support_Request';

// ─── Form types ────────────────────────────────────────────────────────────────

export type SupportMode = 'Physical' | 'Online';

// Combined form data across all steps
export interface RequestFormData {
  // Step 1: Support Type
  category: Support_Request['category'] | '';
  title: string;
  description: string;
  // Step 2: Filtering
  prefStart: string;          // 'YYYY-MM-DD'
  prefEnd: string;            // 'YYYY-MM-DD' (at most 6 days after prefStart, so the grid is max 7 days)
  supportMode: SupportMode;
  requiredSkills: string[];
  // Step 3: Availability Filtering
  availability: string[];     // slot keys: 'YYYY-MM-DDTHH:00'
  // Step 4: Volunteer Match-making
  volID: string;
}

// ─── Date / time helpers ───────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

// Indexed by Date.getDay() (Sunday first)
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const formatDayMonth = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const formatLongDate = (d: Date) => `${formatDayMonth(d)} ${d.getFullYear()}`;
export const formatHour = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseDateKey = (key: string) => new Date(`${key}T00:00:00`);

export const hourToSlot = (h: number) => `${String(h).padStart(2, '0')}:00`;
export const slotToHour = (slot: string) => parseInt(slot, 10);

// A slot key combines the date and the hour: '2026-10-06T13:00'
export const slotKey = (dateKey: string, hour: number) => `${dateKey}T${hourToSlot(hour)}`;
export const parseSlotKey = (key: string) => {
  const [dateKey, time] = key.split('T');
  return { date: parseDateKey(dateKey), hour: slotToHour(time) };
};

export const addDays = (dateKey: string, n: number) => {
  const d = parseDateKey(dateKey);
  d.setDate(d.getDate() + n);
  return toDateKey(d);
};

// Earliest selectable date: tomorrow (same rule as the session form, no same-day or past dates)
export const getTomorrowKey = (from: Date = new Date()) =>
  toDateKey(new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1));

export const getDaysInRange = (startKey: string, endKey: string): Date[] => {
  const days: Date[] = [];
  const end = parseDateKey(endKey);
  for (let d = parseDateKey(startKey); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
};

export const formatDateRange = (startKey: string, endKey: string) =>
  `${formatLongDate(parseDateKey(startKey))} – ${formatLongDate(parseDateKey(endKey))}`;

// ─── Form defaults ─────────────────────────────────────────────────────────────

// A function (not a constant) so the default dates are fresh each time the form starts over
export const createEmptyForm = (): RequestFormData => {
  const start = getTomorrowKey();
  return {
    category: '',
    title: '',
    description: '',
    prefStart: start,
    prefEnd: addDays(start, 6),
    supportMode: 'Physical',
    requiredSkills: [],
    availability: [],
    volID: '',
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
  volID: string;
  name: string;
  rating: number;
  ratingCount: number;
  tags: string[];          // skills
  categories: string[];    // support categories they offer
}

export const MOCK_VOLUNTEERS: Volunteer[] = [
  { volID: 'vol-1', name: 'Aisha Rahman', rating: 4.5, ratingCount: 10, tags: ['Tech Wiz', 'Patience', 'Cooking', 'Friendly'], categories: ['General Student Support', 'Technology Support'] },
  { volID: 'vol-2', name: 'Daniel Lim', rating: 4.0, ratingCount: 2, tags: ['High Achiever', 'Patience', 'Cooking', 'Friendly'], categories: ['General Student Support', 'Academic Support'] },
  { volID: 'vol-3', name: 'Priya Nair', rating: 4.5, ratingCount: 20, tags: ['High Achiever', 'Cooking', 'Friendly'], categories: ['General Student Support', 'New Student Support'] },
  { volID: 'vol-4', name: 'Hafiz Ismail', rating: 4.5, ratingCount: 157, tags: ['Tech Wiz', 'Friendly'], categories: ['Technology Support', 'New Student Support'] },
  { volID: 'vol-5', name: 'Mei Ling Tan', rating: 4.8, ratingCount: 31, tags: ['Smart', 'Academically Gifted', 'Patience'], categories: ['Academic Support'] },
  { volID: 'vol-6', name: 'Arjun Menon', rating: 4.2, ratingCount: 8, tags: ['Creative', 'Organised', 'Friendly', 'Cooking'], categories: ['General Student Support', 'New Student Support'] },
  { volID: 'vol-7', name: 'Siti Aminah', rating: 4.7, ratingCount: 44, tags: ['Tech Wiz', 'Smart', 'Patience'], categories: ['Technology Support', 'Academic Support'] },
  { volID: 'vol-8', name: 'Jason Wong', rating: 3.9, ratingCount: 5, tags: ['Organised', 'High Achiever', 'Friendly'], categories: ['General Student Support', 'Academic Support', 'New Student Support'] },
];

// Hours the volunteer is free, per weekday (JS getDay(): 0 = Sunday ... 6 = Saturday).
// Recurring weekly availability: later this comes from the volunteer's Firestore data.
export const getAvailability = (volID: string): Record<number, number[]> => {
  const n = Number(volID.replace('vol-', ''));
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
      const free = getAvailability(v.volID);
      const overlap = criteria.availability.filter(key => {
        const { date, hour } = parseSlotKey(key);
        return free[date.getDay()]?.includes(hour);
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
  dateRangeLabel: string;
  supportMode: SupportMode;
  slotCount: number;
  volunteer: Volunteer;
}

export const buildSummary = (data: RequestFormData): RequestSummary | null => {
  const volunteer = MOCK_VOLUNTEERS.find(v => v.volID === data.volID);
  if (!volunteer || !data.category) return null;

  return {
    category: data.category,
    title: data.title,
    description: data.description,
    dateRangeLabel: formatDateRange(data.prefStart, data.prefEnd),
    supportMode: data.supportMode,
    slotCount: data.availability.length,
    volunteer,
  };
};