import type {
  DashboardRequestItem,
  DashboardSessionItem,
  DashboardStatus,
} from '../../types/Dashboard';
import type { Support_Request } from '../../types/Support_Request';
import type { Support_Session } from '../../types/Support_Session';

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

// --- Volunteer dashboard display models ---------------------------------------------------------------------------------------

export type VolunteerRequestItem = DashboardRequestItem;

export type VolunteerSessionItem = DashboardSessionItem & {
  reqID: string;
  sessTimeSlot: Support_Session['sessTimeSlot'];
  volunteerRating?: number;
  requesterStatus?: string;
  studentFeedback?: { rating: number; comments: string };
};

export interface VolunteerStudentSummary {
  name: string;
}

// -- Volunteer session status and mapping ---------------------------------------------------------------------------------------

const VOLUNTEER_SESSION_STATUS: Record<Support_Session['sessStatus'], DashboardStatus> = {
  Planned:   { label: 'Planned',   tone: 'planned' },
  Confirmed: { label: 'Confirmed', tone: 'confirmed' },
  Completed: { label: 'Completed', tone: 'completed' },   // finished, waiting for feedback
  Rated:     { label: 'Rated',     tone: 'rated' },       // finished and rated
  Cancelled: { label: 'Cancelled', tone: 'cancelled' },
};

export const getVolunteerSessionStatus = (
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
    if (!session.studConfirmed) return { label: 'Waiting', tone: 'planned' };
    if (!session.volConfirmed) return { label: 'To confirm', tone: 'to-confirm' };
  }

  if (session.sessStatus === 'Confirmed') {
    if (isElapsed) return { label: 'Elapsed', tone: 'to-confirm' };
    if (session.sessDate.toDateString() === now.toDateString()) return { label: 'Today', tone: 'to-confirm' };
  }

  return VOLUNTEER_SESSION_STATUS[session.sessStatus];
};

// Pure mapping: once the data comes from Firestore, only the inputs change
export const toVolunteerSessionItem = (
  session: Support_Session,
  request: Support_Request,
  student: VolunteerStudentSummary
): VolunteerSessionItem => ({
  sessID: session.sessID,
  reqID: session.reqID,
  sessStatus: session.sessStatus,
  studConfirmed: session.studConfirmed,
  volConfirmed: session.volConfirmed,
  category: request.category,
  title: request.title,
  personName: student.name,
  rating: { value: 0, count: 0 },
  sessDate: session.sessDate,
  sessTimeSlot: session.sessTimeSlot,
  dateLabel: formatDate(session.sessDate),
  status: getVolunteerSessionStatus(session),
  description: request.description,
  supportMode: session.supportMode,
  timeslot: formatTimeslot(session.sessTimeSlot.toDate()),
  location: session.meetingLocation,
});

export const buildVolunteerSessionItems = (
  sessions: Support_Session[],
  requests: Support_Request[],
  students: Record<string, VolunteerStudentSummary>
): VolunteerSessionItem[] =>
  sessions.flatMap(session => {
    const request = requests.find(r => r.reqID === session.reqID);
    const student = request ? students[request.studUID] : undefined;
    return request && student ? [toVolunteerSessionItem(session, request, student)] : [];
  });

// -- Volunteer request status and mapping ---------------------------------------------------------------------------------------

const VOLUNTEER_REQUEST_STATUS: Record<Support_Request['reqStatus'], DashboardStatus> = {
  Pending: { label: 'Pending', tone: 'pending' },
  Accepted: { label: 'Accepted', tone: 'accepted' },
  Scheduled: { label: 'Scheduled', tone: 'scheduled' },
  Rejected: { label: 'Rejected', tone: 'rejected' },
  Cancelled: { label: 'Cancelled', tone: 'cancelled' },
};

export const toVolunteerRequestItem = (
  request: Support_Request,
  studentName: string,
): VolunteerRequestItem => ({
  reqID: request.reqID,
  reqStatus: request.reqStatus,
  category: request.category,
  title: request.title,
  personName: studentName,
  dateLabel: formatDate(request.reqTimestamp.toDate()),
  description: request.description,
  status: VOLUNTEER_REQUEST_STATUS[request.reqStatus],
});

// -- Volunteer status update helpers  ---------------------------------------------------------------------------------------

export const createVolunteerRequestPatch = (
  reqStatus: Support_Request['reqStatus'],
): Pick<DashboardRequestItem, 'reqStatus' | 'status'> => ({
  reqStatus,
  status: VOLUNTEER_REQUEST_STATUS[reqStatus],
});






// -- MOCK DATA DELETE LATER ---------------------------------------------------------------------------------------

import { Timestamp } from 'firebase/firestore';

// Volunteer session mock-data builder
function createVolunteerMockSession(
  sessID: string,
  reqID: string,
  sessStatus: VolunteerSessionItem['sessStatus'],
  category: VolunteerSessionItem['category'],
  title: string,
  personName: string,
  dateLabel: string,
  options: Partial<Pick<
    VolunteerSessionItem,
    'studConfirmed' | 'volConfirmed' | 'volunteerRating' | 'requesterStatus' |
    'studentFeedback' | 'supportMode' | 'timeslot' | 'location' | 'description'
  >> = {},
): VolunteerSessionItem {
  const sessDate = new Date(dateLabel);
  const sessTimeSlot = new Date(sessDate);
  sessTimeSlot.setHours(11, 0, 0, 0);

  return {
    sessID,
    reqID,
    sessStatus,
    sessDate,
    sessTimeSlot: Timestamp.fromDate(sessTimeSlot),
    studConfirmed: false,
    volConfirmed: false,
    category,
    title,
    personName,
    rating: { value: 0, count: 0 },
    dateLabel,
    status: VOLUNTEER_SESSION_STATUS[sessStatus],
    supportMode: 'Physical',
    timeslot: '11AM – 12PM',
    location: 'Student lounge meeting area',
    description: `Support session for ${title}.`,
    ...options,
  };
}

// Volunteer request mock data
export const MOCK_INCOMING_REQUESTS: VolunteerRequestItem[] = [
  { reqID: 'r1', reqStatus: 'Pending', category: 'General Student Support', title: 'Cat-sitting for a weekend!', personName: 'Mei Lin', dateLabel: '19 Sep 2026', description: 'I need help looking after my cat while I am away for the weekend.', status: VOLUNTEER_REQUEST_STATUS.Pending },
  { reqID: 'r2', reqStatus: 'Pending', category: 'Technology Support', title: 'Cybersafe Login Problem', personName: 'Daniel Tan', dateLabel: '11 Sep 2026', description: 'I need help securing my account and resolving a login problem.', status: VOLUNTEER_REQUEST_STATUS.Pending },
  { reqID: 'req-1', reqStatus: 'Accepted', category: 'General Student Support', title: 'Grass Cutting Helper', personName: 'Chiikawa', dateLabel: '4 Oct 2026', description: 'Looking for some help with cutting the grass.', status: VOLUNTEER_REQUEST_STATUS.Accepted },
  { reqID: 'r4', reqStatus: 'Scheduled', category: 'Academic Support', title: 'Study Group Starter', personName: 'Hachiware', dateLabel: '11 Aug 2025', description: 'I would like help getting a study group started.', status: VOLUNTEER_REQUEST_STATUS.Scheduled },
  { reqID: 'r5', reqStatus: 'Rejected', category: 'General Student Support', title: 'Moving Boxes', personName: 'Usagi', dateLabel: '4 Apr 2025', description: 'I need a hand moving some boxes.', status: VOLUNTEER_REQUEST_STATUS.Rejected },
];

// Volunteer session and history mock data
export const MOCK_VOLUNTEER_SESSIONS: VolunteerSessionItem[] = [
  createVolunteerMockSession('sess-1', 'req-1', 'Planned', 'General Student Support', 'Grass Cutting Helper', 'Chiikawa', '4 Oct 2026', { requesterStatus: 'Accepted', volConfirmed: true }),
  createVolunteerMockSession('sess-2', 'req-2', 'Planned', 'Technology Support', 'Help Fix My Laptop!!', 'Omniman', '6 Oct 2026', { requesterStatus: 'Accepted', studConfirmed: true, supportMode: 'Virtual', location: 'Video call link shared with the student' }),
  createVolunteerMockSession('sess-3', 'req-1', 'Confirmed', 'General Student Support', 'Grass Cutting Helper', 'Chiikawa', '12 Oct 2026', { requesterStatus: 'Accepted', studConfirmed: true, volConfirmed: true }),
  createVolunteerMockSession('sess-4', 'req-4', 'Confirmed', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Natasha Laoshi', '11 Aug 2025', { requesterStatus: 'Accepted', studConfirmed: true, volConfirmed: true }),
  createVolunteerMockSession('sess-5', 'req-4', 'Completed', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Natasha Laoshi', '11 Aug 2025', { requesterStatus: 'Accepted', studConfirmed: true, volConfirmed: true }),
];

export const MOCK_VOLUNTEER_HISTORY: VolunteerSessionItem[] = [
  createVolunteerMockSession('h1', 'req-4', 'Rated', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Student Name', '11 Aug 2025', { requesterStatus: 'Accepted', volunteerRating: 4.5, studConfirmed: true, volConfirmed: true, studentFeedback: { rating: 4.5, comments: 'Great session with clear explanations. I feel much more confident now.' } }),
  createVolunteerMockSession('h2', 'req-4', 'Rated', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Student Name', '11 Aug 2025', { requesterStatus: 'Accepted', volunteerRating: 4.5, studConfirmed: true, volConfirmed: true, studentFeedback: { rating: 5, comments: 'Very patient and helpful. The examples made difficult topics easier to understand.' } }),
  createVolunteerMockSession('h3', 'req-4', 'Rated', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Student Name', '11 Aug 2025', { requesterStatus: 'Accepted', volunteerRating: 4.5, studConfirmed: true, volConfirmed: true, studentFeedback: { rating: 4.5, comments: 'Loved the clear explanations and supportive teaching.' } }),
  createVolunteerMockSession('h4', 'req-8', 'Cancelled', 'Academic Support', 'Code Website for my Event', 'Steve Jobs', '11 Aug 2025', { requesterStatus: 'Cancelled' }),
  createVolunteerMockSession('h5', 'req-8', 'Cancelled', 'Academic Support', 'Code Website for my Event', 'Steve Jobs', '11 Aug 2025', { requesterStatus: 'Cancelled' }),
];