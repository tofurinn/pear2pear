import type { Support_Request } from '../../types/Support_Request';
import type { Support_Session } from '../../types/Support_Session';
import type {
  DashboardStatus,
  DashboardRequestItem,
  DashboardSessionItem,
} from '../../types/Dashboard';

// --- Shared date and time helpers ---------------------------------------------------------------------------------------

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const formatHour = (hour: number) => `${hour % 12 || 12}${hour < 12 ? 'am' : 'pm'}`;
export const hourToSlot = (hour: number) => `${String(hour).padStart(2, '0')}:00`;
export const slotToHour = (slot: string) => parseInt(slot, 10);
export const weekdaySlotKey = (weekday: number, hour: number) => `${weekday}:${hourToSlot(hour)}`;

export const parseWeekdaySlotKey = (key: string) => {
  const separator = key.indexOf(':');
  return {
    weekday: Number(key.slice(0, separator)),
    hour: slotToHour(key.slice(separator + 1)),
  };
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

export const formatDayMonth = (date: Date) => `${date.getDate()} ${MONTHS[date.getMonth()]}`;
export const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatLongDate = (date: Date) => `${formatDayMonth(date)} ${date.getFullYear()}`;
export const formatTimeslotRange = (hour: number) =>
  `${formatHour(hour).toUpperCase()} – ${formatHour(hour + 1).toUpperCase()}`;
export const formatTimeslot = (start: Date) => {
  const formatTime = (date: Date) => {
    const hour = date.getHours();
    return `${hour % 12 || 12}${hour < 12 ? 'AM' : 'PM'}`;
  };
  return `${formatTime(start)} – ${formatTime(new Date(start.getTime() + 60 * 60 * 1000))}`;
};

export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDateKey = (key: string) => new Date(`${key}T00:00:00`);

// -- Student dashboard display models ---------------------------------------------------------------------------------------

export interface StudentVolunteerSummary {
  name: string;
  rating: number;
  ratingCount: number;
  skills?: string[];
}

export interface StudentSessionItem extends DashboardSessionItem {
  reqID: string;
  sessTimeSlot: Support_Session['sessTimeSlot'];
  volunteer?: {
    name: string;
    rating: number;
    reviewCount: number;
    skills?: string[];
    requestStatusLabel?: string;
  };
}

export interface StudentRequestItem extends DashboardRequestItem {
  volunteer: {
    name: string;
    rating: number;
    reviewCount: number;
    skills?: string[];
    requestStatusLabel: string;
  };
}

// -- Student request status and mapping ---------------------------------------------------------------------------------------

const STUDENT_REQUEST_STATUS: Record<Support_Request['reqStatus'], DashboardStatus> = {
  Pending: { label: 'Pending', tone: 'pending' },
  Accepted: { label: 'Accepted', tone: 'accepted' },
  Scheduled: { label: 'Scheduled', tone: 'scheduled' },   // a session has been arranged from it
  Rejected: { label: 'Rejected', tone: 'rejected' },
  Cancelled: { label: 'Cancelled', tone: 'cancelled' },
};

export const getStudentRequestStatus = (reqStatus: Support_Request['reqStatus']) =>
  STUDENT_REQUEST_STATUS[reqStatus];

export const toStudentRequestItem = (
  request: Support_Request,
  volunteer: StudentVolunteerSummary,
): StudentRequestItem => ({
  reqID: request.reqID,
  reqStatus: request.reqStatus,
  category: request.category,
  title: request.title,
  personName: volunteer.name,
  dateLabel: formatDate(request.reqTimestamp.toDate()),
  status: getStudentRequestStatus(request.reqStatus),
  description: request.description,
  volunteer: {
    name: volunteer.name,
    rating: volunteer.rating,
    reviewCount: volunteer.ratingCount,
    skills: volunteer.skills,
    requestStatusLabel: request.reqStatus,
  },
});

export const buildStudentRequestItems = (
  requests: Support_Request[],
  volunteers: Record<string, StudentVolunteerSummary>,
): StudentRequestItem[] =>
  requests.map(request =>
    toStudentRequestItem(request, volunteers[request.volID] ?? {
      name: 'Volunteer',
      rating: 0,
      ratingCount: 0,
    })
  );

// -- Student session status and mapping ---------------------------------------------------------------------------------------

const STUDENT_SESSION_STATUS: Record<Support_Session['sessStatus'], DashboardStatus> = {
  Planned: { label: 'Planned', tone: 'planned' },
  Confirmed: { label: 'Confirmed', tone: 'confirmed' },
  Completed: { label: 'Completed', tone: 'completed' },   // finished, waiting for feedback
  Rated: { label: 'Rated', tone: 'rated' },       // finished and rated
  Cancelled: { label: 'Cancelled', tone: 'cancelled' },
};

// Planned means only one side has confirmed so far. Labels are from the student's point of view.
export const getStudentSessionStatus = (
  session: Pick<Support_Session, 'sessDate' | 'sessTimeSlot' | 'sessStatus' | 'studConfirmed' | 'volConfirmed'>,
  now = new Date(),
): DashboardStatus => {
  const slotTime = session.sessTimeSlot.toDate();
  const sessionStart = new Date(session.sessDate);
  sessionStart.setHours(slotTime.getHours(), slotTime.getMinutes(), slotTime.getSeconds(), slotTime.getMilliseconds());
  const isElapsed = sessionStart <= now;

  if (session.sessStatus === 'Planned') {
    if ((!session.studConfirmed || !session.volConfirmed) && isElapsed) {
      return { label: 'Elapsed', tone: 'to-confirm' };
    }
    if (!session.volConfirmed) return { label: 'Waiting', tone: 'planned' };
    if (!session.studConfirmed) return { label: 'To confirm', tone: 'to-confirm' };
  }

  if (session.sessStatus === 'Confirmed') {
    if (isElapsed) return { label: 'Elapsed', tone: 'to-confirm' };
    if (session.sessDate.toDateString() === now.toDateString()) return { label: 'Today', tone: 'to-confirm' };
  }

  return STUDENT_SESSION_STATUS[session.sessStatus];
};

// Pure mapping: once the data comes from Firestore, only the inputs change
export const toStudentSessionItem = (
  session: Support_Session,
  request: Support_Request,
  volunteer: StudentVolunteerSummary
): StudentSessionItem => ({
  sessID: session.sessID,
  reqID: session.reqID,
  sessStatus: session.sessStatus,
  studConfirmed: session.studConfirmed,
  volConfirmed: session.volConfirmed,
  category: request.category,
  title: request.title,
  personName: volunteer.name,
  rating: { value: volunteer.rating, count: volunteer.ratingCount },
  sessDate: session.sessDate,
  sessTimeSlot: session.sessTimeSlot,
  dateLabel: formatDate(session.sessDate),
  status: getStudentSessionStatus(session),
  description: request.description,
  supportMode: session.supportMode,
  timeslot: formatTimeslot(session.sessTimeSlot.toDate()),
  location: session.meetingLocation,
  volunteer: {
    name: volunteer.name,
    rating: volunteer.rating,
    reviewCount: volunteer.ratingCount,
    skills: volunteer.skills,
    requestStatusLabel: request.reqStatus,
  },
});

export const buildStudentSessionItems = (
  sessions: Support_Session[],
  requests: Support_Request[],
  volunteers: Record<string, StudentVolunteerSummary>
): StudentSessionItem[] =>
  sessions.flatMap(session => {
    const request = requests.find(r => r.reqID === session.reqID);
    const volunteer = request ? volunteers[request.volID] : undefined;
    return request && volunteer ? [toStudentSessionItem(session, request, volunteer)] : [];
  });



















// -- MOCK DATA DELETE LATER ---------------------------------------------------------------------------------------

import { Timestamp } from 'firebase/firestore';

// -- Student session and volunteer mock data  ---------------------------------------------------------------------------------------

export const MOCK_VOLUNTEERS: Record<string, StudentVolunteerSummary> = {
  'vol-chiikawa': { name: 'Chiikawa', rating: 4.5, ratingCount: 10, skills: ['Gardening', 'Lawn care'] },
  'vol-omniman': { name: 'Omniman', rating: 4, ratingCount: 2, skills: ['Computer repair', 'IT troubleshooting'] },
  'vol-natasha': { name: 'Natasha Laoshi', rating: 4.5, ratingCount: 10, skills: ['Mathematics', 'Study support'] },
  'vol-steve': { name: 'Steve Jobs', rating: 5, ratingCount: 3, skills: ['Web development', 'Design'] },
  'vol-haiqal': { name: 'Haiqal Chan', rating: 4, ratingCount: 5, skills: ['English', 'Writing'] },
  'vol-joy': { name: 'Joy Lau Xuan', rating: 4.5, ratingCount: 8, skills: ['Presentation skills', 'Public speaking'] },
  'vol-usagi': { name: 'Usagi bin Obama', rating: 3.5, ratingCount: 4, skills: ['Event planning', 'Organisation'] },
};

type SessionStatus = Support_Session['sessStatus'];

const GRASS = { title: 'Grass Cutting Helper', category: 'General Student Support' } as const;
const LAPTOP = { title: 'Help Fix My Laptop!!', category: 'Technology Support' } as const;
const MATHS = { title: 'Help Me do Advanced Maths (fec101)', category: 'Academic Support' } as const;
const WEBSITE = { title: 'Code Website for my Event', category: 'Academic Support' } as const;

// vol / topic / date [y, m, d] / status / studConfirmed / volConfirmed
const ROWS: [string, Pick<Support_Request, 'title' | 'category'>, [number, number, number], SessionStatus, boolean, boolean][] = [
  ['vol-chiikawa', GRASS, [2026, 10, 4], 'Planned', true, false],  // student confirmed, waiting for the volunteer
  ['vol-omniman', LAPTOP, [2026, 10, 6], 'Planned', false, true],   // volunteer confirmed, student still to confirm
  ['vol-chiikawa', GRASS, [2026, 10, 4], 'Confirmed', true, true],
  ['vol-natasha', MATHS, [2025, 8, 11], 'Completed', true, true],   // to rate
  ['vol-natasha', MATHS, [2025, 8, 11], 'Rated', true, true],
  ['vol-natasha', MATHS, [2025, 8, 11], 'Rated', true, true],
  ['vol-natasha', MATHS, [2025, 8, 11], 'Rated', true, true],
  ['vol-steve', WEBSITE, [2025, 8, 11], 'Cancelled', true, false],
  ['vol-steve', WEBSITE, [2025, 8, 11], 'Cancelled', true, false],
];

export const MOCK_REQUESTS: Support_Request[] = ROWS.map(([volID, topic, [y, m, d]], i) => ({
  reqID: `req-${i + 1}`,
  studID: 'stud-1',
  volID,
  title: topic.title,
  description: 'Mock request for testing.',
  category: topic.category,
  reqStatus: 'Scheduled',
  reqTimestamp: Timestamp.fromDate(new Date(y, m - 1, d)),
}));

export const MOCK_SESSIONS: Support_Session[] = ROWS.map(([, , [y, m, d], sessStatus, studConfirmed, volConfirmed], i) => {
  const date = new Date(y, m - 1, d);
  const timeSlot = new Date(date);
  timeSlot.setHours(15, 0, 0, 0);
  return {
    sessID: `sess-${i + 1}`,
    reqID: `req-${i + 1}`,
    sessDate: date,
    sessTimeSlot: Timestamp.fromDate(timeSlot),
    supportMode: 'Physical',
    meetingLocation: 'Student Lounge 2 at the sofa',
    sessStatus,
    sessTimestamp: Timestamp.fromDate(date),
    studConfirmed,
    volConfirmed,
  };
});

export const MOCK_SESSION_FEEDBACK: Record<string, { rating: number; comments: string }> = {
  'sess-5': {
    rating: 4.5,
    comments: 'Loved her way of teaching! I went from a baka to a genius overnight. I think I was blessed by the presence of Einstein actually. Would recommend requesting her again. The test was GG FURKIN EZZZZZ',
  },
  'sess-6': {
    rating: 5,
    comments: 'Very patient and helpful. The examples made the difficult topics much easier to understand.',
  },
  'sess-7': {
    rating: 4.5,
    comments: 'Great session with clear explanations. I feel much more confident about the subject now.',
  },
};

// -- Student request mock data  ---------------------------------------------------------------------------------------

const CAT_SITTING = { title: 'Cat-sitting for a weekend!', category: 'General Student Support' } as const;
const LOGIN = { title: 'Cybersafe Login Problem', category: 'Technology Support' } as const;
const BIRTHDAY = { title: 'Birthday Party Helper!!!', category: 'General Student Support' } as const;

const mockRequest = (
  n: number,
  volID: string,
  topic: Pick<Support_Request, 'title' | 'category'>,
  reqStatus: Support_Request['reqStatus'],
  [y, m, d]: [number, number, number]
): Support_Request => ({
  reqID: `my-req-${n}`,
  studID: 'stud-1',
  volID,
  title: topic.title,
  description: 'Mock request for testing.',
  category: topic.category,
  reqStatus,
  reqTimestamp: Timestamp.fromDate(new Date(y, m - 1, d)),
});

export const MOCK_MY_REQUESTS: Support_Request[] = [
  mockRequest(1, 'vol-haiqal', CAT_SITTING, 'Pending', [2026, 9, 19]),
  mockRequest(2, 'vol-joy', LOGIN, 'Pending', [2026, 9, 11]),
  mockRequest(3, 'vol-chiikawa', GRASS, 'Accepted', [2026, 10, 4]),
  mockRequest(4, 'vol-natasha', MATHS, 'Scheduled', [2025, 8, 11]),
  mockRequest(5, 'vol-usagi', BIRTHDAY, 'Rejected', [2025, 4, 4]),
];