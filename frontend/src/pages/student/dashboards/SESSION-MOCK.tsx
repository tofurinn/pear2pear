import { Timestamp } from 'firebase/firestore';
import type { Support_Request } from '../../../types/Support_Request';
import type { Support_Session } from '../../../types/Support_Session';

// ─── What a session card needs ─────────────────────────────────────────────────

export type StatusTone = 'planned' | 'confirmed' | 'completed' | 'rated' | 'cancelled';

// Volunteer.name lives on User and the rating count isn't stored yet, so the backend will assemble this
export interface VolunteerSummary {
  name: string;
  rating: number;
  ratingCount: number;
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
}

const STATUS_PILL: Record<Support_Session['sessStatus'], { label: string; tone: StatusTone }> = {
  Planned:   { label: 'Planned',   tone: 'planned' },
  Confirmed: { label: 'Confirmed', tone: 'confirmed' },
  Completed: { label: 'Completed', tone: 'completed' },   // finished, waiting for feedback
  Rated:     { label: 'Rated',     tone: 'rated' },       // finished and rated
  Cancelled: { label: 'Cancelled', tone: 'cancelled' },
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
  status: STATUS_PILL[session.sessStatus],
});

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
  'vol-chiikawa': { name: 'Chiikawa', rating: 4.5, ratingCount: 10 },
  'vol-omniman':  { name: 'Omniman', rating: 4, ratingCount: 2 },
  'vol-natasha':  { name: 'Natasha Laoshi', rating: 4.5, ratingCount: 10 },
  'vol-steve':    { name: 'Steve Jobs', rating: 5, ratingCount: 3 },
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
  return {
    sessID: `sess-${i + 1}`,
    reqID: `req-${i + 1}`,
    sessDate: date,
    sessTimeSlot: Timestamp.fromDate(date),
    supportMode: 'Physical',
    meetingLocation: 'Student Lounge 2 at the sofa',
    sessStatus,
    sessTimestamp: Timestamp.fromDate(date),
    studConfirmed,
    volConfirmed,
  };
});