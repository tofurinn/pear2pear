import { Timestamp } from 'firebase/firestore';
import type { Support_Request } from '../../../types/Support_Request';
import type { Support_Session } from '../../../types/Support_Session';

// ─── What a session card needs ─────────────────────────────────────────────────

export type StatusTone =
  | 'planned' | 'to-confirm' | 'confirmed' | 'completed' | 'rated' | 'cancelled'   // sessions
  | 'pending' | 'accepted' | 'scheduled' | 'rejected' | 'awaiting';                  // requests (cancelled is shared)

// Volunteer.name lives on User and the rating count isn't stored yet, so the backend will assemble this
export interface VolunteerSummary {
  name: string;
  rating: number;
  ratingCount: number;
  skills?: string[];
}

export interface SessionItem {
  sessID: string;
  sessStatus: Support_Session['sessStatus'];
  studConfirmed: boolean;
  volConfirmed: boolean;
  category: Support_Request['category'];
  title: string;
  personName: string;
  rating: { value: number; count: number };
  sessDate: Date;           // for sorting
  dateLabel: string;
  status: { label: string; tone: StatusTone };
  description?: string;
  supportMode?: Support_Session['supportMode'];
  timeslot?: string;
  location?: string;
  volunteer?: {
    name: string;
    rating: number;
    reviewCount: number;
    skills?: string[];
    requestStatusLabel?: string;
  };
}

const STATUS_PILL: Record<Support_Session['sessStatus'], { label: string; tone: StatusTone }> = {
  Planned:   { label: 'Planned',   tone: 'planned' },
  Confirmed: { label: 'Confirmed', tone: 'confirmed' },
  Completed: { label: 'Completed', tone: 'completed' },   // finished, waiting for feedback
  Rated:     { label: 'Rated',     tone: 'rated' },       // finished and rated
  Cancelled: { label: 'Cancelled', tone: 'cancelled' },
};

// Planned means only one side has confirmed so far. Labels are from the student's point of view.
const getStatusPill = (session: Support_Session): { label: string; tone: StatusTone } => {
  if (session.sessStatus === 'Planned') {
    if (session.studConfirmed && !session.volConfirmed) return { label: 'Waiting', tone: 'planned' }; // student arranged it, volunteer hasn't responded
    if (!session.studConfirmed && session.volConfirmed) return { label: 'To confirm', tone: 'to-confirm' };  // volunteer arranged it, student still has to confirm
  }
  return STATUS_PILL[session.sessStatus];
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Pure mapping: once the data comes from Firestore, only the inputs change
export const toSessionItem = (
  session: Support_Session,
  request: Support_Request,
  volunteer: VolunteerSummary
): SessionItem => ({
  sessID: session.sessID,
  sessStatus: session.sessStatus,
  studConfirmed: session.studConfirmed,
  volConfirmed: session.volConfirmed,
  category: request.category,
  title: request.title,
  personName: volunteer.name,
  rating: { value: volunteer.rating, count: volunteer.ratingCount },
  sessDate: session.sessDate,
  dateLabel: formatDate(session.sessDate),
  status: getStatusPill(session),
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

const formatTimeslot = (start: Date) => {
  const formatHour = (date: Date) => {
    const hour = date.getHours();
    return `${hour % 12 || 12}${hour < 12 ? 'AM' : 'PM'}`;
  };
  return `${formatHour(start)} – ${formatHour(new Date(start.getTime() + 60 * 60 * 1000))}`;
};

export const buildSessionItems = (
  sessions: Support_Session[],
  requests: Support_Request[],
  volunteers: Record<string, VolunteerSummary>
): SessionItem[] =>
  sessions.flatMap(session => {
    const request = requests.find(r => r.reqID === session.reqID);
    const volunteer = request ? volunteers[request.volID] : undefined;
    return request && volunteer ? [toSessionItem(session, request, volunteer)] : [];
  });

// ─── Mock data (delete once this comes from Firestore) ─────────────────────────

export const MOCK_VOLUNTEERS: Record<string, VolunteerSummary> = {
  'vol-chiikawa': { name: 'Chiikawa', rating: 4.5, ratingCount: 10, skills: ['Gardening', 'Lawn care'] },
  'vol-omniman':  { name: 'Omniman', rating: 4, ratingCount: 2, skills: ['Computer repair', 'IT troubleshooting'] },
  'vol-natasha':  { name: 'Natasha Laoshi', rating: 4.5, ratingCount: 10, skills: ['Mathematics', 'Study support'] },
  'vol-steve':    { name: 'Steve Jobs', rating: 5, ratingCount: 3, skills: ['Web development', 'Design'] },
  'vol-haiqal':   { name: 'Haiqal Chan', rating: 4, ratingCount: 5, skills: ['English', 'Writing'] },
  'vol-joy':      { name: 'Joy Lau Xuan', rating: 4.5, ratingCount: 8, skills: ['Presentation skills', 'Public speaking'] },
  'vol-usagi':    { name: 'Usagi bin Obama', rating: 3.5, ratingCount: 4, skills: ['Event planning', 'Organisation'] },
};

type SessionStatus = Support_Session['sessStatus'];

const GRASS = { title: 'Grass Cutting Helper', category: 'General Student Support' } as const;
const LAPTOP = { title: 'Help Fix My Laptop!!', category: 'Technology Support' } as const;
const MATHS = { title: 'Help Me do Advanced Maths (fec101)', category: 'Academic Support' } as const;
const WEBSITE = { title: 'Code Website for my Event', category: 'Academic Support' } as const;

// vol / topic / date [y, m, d] / status / studConfirmed / volConfirmed
const ROWS: [string, Pick<Support_Request, 'title' | 'category'>, [number, number, number], SessionStatus, boolean, boolean][] = [
  ['vol-chiikawa', GRASS,   [2026, 10, 4], 'Planned',   true,  false],  // student confirmed, waiting for the volunteer
  ['vol-omniman',  LAPTOP,  [2026, 10, 6], 'Planned',   false, true],   // volunteer confirmed, student still to confirm
  ['vol-chiikawa', GRASS,   [2026, 10, 4], 'Confirmed', true,  true],
  ['vol-natasha',  MATHS,   [2025, 8, 11], 'Completed', true,  true],   // to rate
  ['vol-natasha',  MATHS,   [2025, 8, 11], 'Rated',     true,  true],
  ['vol-natasha',  MATHS,   [2025, 8, 11], 'Rated',     true,  true],
  ['vol-natasha',  MATHS,   [2025, 8, 11], 'Rated',     true,  true],
  ['vol-steve',    WEBSITE, [2025, 8, 11], 'Cancelled', true,  false],
  ['vol-steve',    WEBSITE, [2025, 8, 11], 'Cancelled', true,  false],
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

// ─── My Requests ───────────────────────────────────────────────────────────────

export interface RequestItem {
  reqID: string;
  reqStatus: Support_Request['reqStatus'];
  category: Support_Request['category'];
  title: string;
  personName: string;
  dateLabel: string;
  status: { label: string; tone: StatusTone };
  description: string;
  volunteer: {
    name: string;
    rating: number;
    reviewCount: number;
    skills?: string[];
    requestStatusLabel: string;
  };
}

const REQUEST_STATUS_PILL: Record<Support_Request['reqStatus'], { label: string; tone: StatusTone }> = {
  Pending:   { label: 'Pending',   tone: 'pending' },
  Accepted:  { label: 'Accepted',  tone: 'accepted' },
  Scheduled: { label: 'Scheduled', tone: 'scheduled' },   // a session has been arranged from it
  Rejected:  { label: 'Rejected',  tone: 'rejected' },
  Cancelled: { label: 'Cancelled', tone: 'cancelled' },
};

// Pure mapping, like toSessionItem: once the data comes from Firestore only the inputs change
export const toRequestItem = (request: Support_Request, volunteer: VolunteerSummary): RequestItem => ({
  reqID: request.reqID,
  reqStatus: request.reqStatus,
  category: request.category,
  title: request.title,
  personName: volunteer.name,
  dateLabel: formatDate(request.reqTimestamp.toDate()),
  status: REQUEST_STATUS_PILL[request.reqStatus],
  description: request.description,
  volunteer: {
    name: volunteer.name,
    rating: volunteer.rating,
    reviewCount: volunteer.ratingCount,
    skills: volunteer.skills,
    requestStatusLabel: request.reqStatus,
  },
});

export const buildRequestItems = (
  requests: Support_Request[],
  volunteers: Record<string, VolunteerSummary>
): RequestItem[] =>
  requests.flatMap(request => {
    const volunteer = volunteers[request.volID];
    return volunteer ? [toRequestItem(request, volunteer)] : [];
  });

// Mock requests for the My Requests page (delete once this comes from Firestore)
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
  mockRequest(1, 'vol-haiqal',   CAT_SITTING, 'Pending',   [2026, 9, 19]),
  mockRequest(2, 'vol-joy',      LOGIN,       'Pending',   [2026, 9, 11]),
  mockRequest(3, 'vol-chiikawa', GRASS,       'Accepted',  [2026, 10, 4]),
  mockRequest(4, 'vol-natasha',  MATHS,       'Scheduled', [2025, 8, 11]),
  mockRequest(5, 'vol-usagi',    BIRTHDAY,    'Rejected',  [2025, 4, 4]),
];