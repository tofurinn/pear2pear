import { Timestamp } from 'firebase/firestore';
import type { Support_Request } from '../../../types/Support_Request';

// ─── Form types ────────────────────────────────────────────────────────────────

// Combined form data across all steps (maps onto Support_Session fields)
export interface SessionFormData {
  // Step 1
  reqID: string;
  // Step 2
  sessDate: string;      // 'YYYY-MM-DD' -> convert to Date on submit
  sessTimeSlot: string;  // 'HH:00' (start of the hour) -> convert to Timestamp on submit
  // Step 3
  supportMode: 'Physical' | 'Online';
  meetingLocation: string;
}

export const EMPTY_FORM: SessionFormData = {
  reqID: '',
  sessDate: '',
  sessTimeSlot: '',
  supportMode: 'Physical',
  meetingLocation: '',
};

// ─── Mock data (replace with Firebase / API later) ─────────────────────────────

export interface Volunteer {
  volID: string;
  name: string;
  rating: number;
  ratingCount: number;
  tags: string[];
}

const VOLUNTEER_NAMES = ['Aisha Rahman', 'Daniel Lim', 'Priya Nair', 'Hafiz Ismail'];

export const MOCK_VOLUNTEERS: Record<string, Volunteer> = Object.fromEntries(
  VOLUNTEER_NAMES.map((name, i) => [
    `vol-${i + 1}`,
    {
      volID: `vol-${i + 1}`,
      name,
      rating: 4.5,
      ratingCount: 10,
      tags: ['Tech Wiz', 'Patience', 'Cooking', 'Friendly', 'Smart', 'Academically Gifted'],
    },
  ])
);

export const MOCK_REQUESTS: Support_Request[] = VOLUNTEER_NAMES.map((_, i) => ({
  reqID: `req-${i + 1}`,
  studID: 'stud-1',
  volID: `vol-${i + 1}`,
  title: 'Grass Cutting Helper',
  description: 'Help cutting the grass.',
  category: 'General Student Support',
  reqStatus: 'Accepted',
  reqTimestamp: Timestamp.fromDate(new Date('2026-10-04')),
}));

// Hours the volunteer is free, per weekday (JS getDay(): 0 = Sunday ... 6 = Saturday).
// Recurring weekly availability: later this comes from the volunteer's Firestore data.
export const getAvailability = (_volID: string): Record<number, number[]> => {
  const weekday = [10, 11, 12, 13, 16, 17];
  const weekend = [10, 11, 12, 13, 14, 15, 16, 17];
  return { 1: [10, 11, 12], 2: weekday, 3: weekday, 4: weekday, 5: weekend, 6: weekend, 0: weekend };
};

// ─── Date / time helpers ───────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

// Indexed by Date.getDay() (Sunday first)
export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const formatDayMonth = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
export const formatLongDate = (d: Date) => `${formatDayMonth(d)} ${d.getFullYear()}`;
export const formatHour = (h: number) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
export const formatTimeslotRange = (h: number) =>
  `${formatHour(h).toUpperCase()} – ${formatHour(h + 1).toUpperCase()}`;

export const toDateKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parseDateKey = (key: string) => new Date(`${key}T00:00:00`);

export const hourToSlot = (h: number) => `${String(h).padStart(2, '0')}:00`;
export const slotToHour = (slot: string) => parseInt(slot, 10);

// The next `count` days starting from tomorrow, based on the device's clock.
// Today is excluded, so there are no same-day or past slots to worry about.
export const getUpcomingDays = (count = 7, from: Date = new Date()): Date[] =>
  Array.from({ length: count }, (_, i) =>
    new Date(from.getFullYear(), from.getMonth(), from.getDate() + 1 + i)
  );

// ─── Summary for the confirmation page ─────────────────────────────────────────

export interface SessionSummary {
  category: Support_Request['category'];
  title: string;
  dateLabel: string;
  timeslotLabel: string;
  supportMode: SessionFormData['supportMode'];
  meetingLocation: string;
  volunteer: Volunteer;
}

export const getRequestById = (reqID: string) => MOCK_REQUESTS.find(r => r.reqID === reqID);
export const getVolunteerById = (volID: string) => MOCK_VOLUNTEERS[volID];

export const buildSummary = (data: SessionFormData): SessionSummary | null => {
  const request = getRequestById(data.reqID);
  const volunteer = request ? getVolunteerById(request.volID) : undefined;
  if (!request || !volunteer) return null;

  return {
    category: request.category,
    title: request.title,
    dateLabel: formatLongDate(parseDateKey(data.sessDate)),
    timeslotLabel: formatTimeslotRange(slotToHour(data.sessTimeSlot)),
    supportMode: data.supportMode,
    meetingLocation: data.meetingLocation,
    volunteer,
  };
};