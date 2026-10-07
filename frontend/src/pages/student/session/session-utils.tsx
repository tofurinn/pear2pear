import { Timestamp } from 'firebase/firestore';
import type { Support_Request } from '../../../types/Support_Request';
import type { Support_Session } from '../../../types/Support_Session';

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

const VOLUNTEER_NAMES = [
  'Aisha Rahman', 'Daniel Lim', 'Priya Nair', 'Hafiz Ismail', 'Mei Ling Tan',
  'Arjun Menon', 'Siti Aminah', 'Jason Wong', 'Nurul Huda', 'Kevin Raj',
];

const REQUEST_DETAILS: Pick<Support_Request, 'title' | 'category'>[] = [
  { title: 'Grass Cutting Helper', category: 'General Student Support' },
  { title: 'Calculus Revision Buddy', category: 'Academic Support' },
  { title: 'Laptop Setup Help', category: 'Technology Support' },
  { title: 'Campus Tour Guide', category: 'New Student Support' },
  { title: 'Essay Proofreading', category: 'Academic Support' },
  { title: 'Wi-Fi Troubleshooting', category: 'Technology Support' },
  { title: 'Moving Boxes Helper', category: 'General Student Support' },
  { title: 'Course Registration Guide', category: 'New Student Support' },
  { title: 'Python Debugging Session', category: 'Technology Support' },
  { title: 'Study Group Starter', category: 'Academic Support' },
];

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
  ...REQUEST_DETAILS[i],
  description: 'Mock request for testing.',
  reqStatus: 'Accepted',
  reqTimestamp: Timestamp.fromDate(new Date(2026, 9, 4 + i)),
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

// ─── Step rules (shared by the booking form and the rearrangement page) ───────

export type SessionStepKey = 'request' | 'timeSlot' | 'meetup';

// Whether a step has what it needs before the student can move on
export const isStepValid = (step: SessionStepKey, data: SessionFormData): boolean => {
  switch (step) {
    case 'request':  return data.reqID !== '';
    case 'timeSlot': return data.sessDate !== '' && data.sessTimeSlot !== '';
    case 'meetup':   return data.meetingLocation.trim() !== '';
  }
};

// ─── Rearranging an existing session ───────────────────────────────────────────

// Starts the form from the session's current arrangement, so its slot is preselected in step 2
export const sessionToFormData = (session: Support_Session): SessionFormData => ({
  reqID: session.reqID,
  sessDate: toDateKey(session.sessDate),
  sessTimeSlot: hourToSlot(session.sessTimeSlot.toDate().getHours()),
  supportMode: session.supportMode,
  meetingLocation: session.meetingLocation,
});

// Only Planned or Confirmed sessions can be changed, and only before the day of the session
// (the time-slot grid starts tomorrow)
export const canEditSession = (session: Support_Session): boolean =>
  (session.sessStatus === 'Planned' || session.sessStatus === 'Confirmed') &&
  session.sessDate >= getUpcomingDays(1)[0];

// Mock sessions for the rearrangement page (delete once this comes from Firestore).
// IDs match the My Sessions mock; dates are relative to today so they always sit inside the 7-day grid.
const mockSession = (
  sessID: string,
  reqID: string,
  daysAhead: number,           // 0 = tomorrow
  sessStatus: Support_Session['sessStatus'],
  studConfirmed: boolean,
  volConfirmed: boolean,
  supportMode: Support_Session['supportMode'],
  meetingLocation: string
): Support_Session => {
  const sessDate = getUpcomingDays(7)[daysAhead];
  const slot = new Date(sessDate);
  slot.setHours(11, 0, 0, 0);  // 11am is free on every weekday in the mock availability

  return {
    sessID,
    reqID,
    sessDate,
    sessTimeSlot: Timestamp.fromDate(slot),
    supportMode,
    meetingLocation,
    sessStatus,
    sessTimestamp: Timestamp.fromDate(slot),
    studConfirmed,
    volConfirmed,
  };
};

export const MOCK_EDITABLE_SESSIONS: Support_Session[] = [
  mockSession('sess-1', 'req-1', 1, 'Planned',   true,  false, 'Physical', 'Student Lounge 2 at the sofa'),
  mockSession('sess-2', 'req-2', 3, 'Planned',   false, true,  'Online',   'Paste the meeting link here'),
  mockSession('sess-3', 'req-3', 2, 'Confirmed', true,  true,  'Physical', 'Library entrance'),
  mockSession('sess-4', 'req-4', 0, 'Completed', true,  true,  'Physical', 'Student Lounge 2 at the sofa'),  // not editable
];

export const getSessionById = (sessID: string) => MOCK_EDITABLE_SESSIONS.find(s => s.sessID === sessID);