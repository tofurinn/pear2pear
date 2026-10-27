import type { Support_Request } from '../../types/Support_Request';
import type { Support_Session } from '../../types/Support_Session';
import type {
  DashboardStatus,
  DashboardRequestItem,
  DashboardSessionItem,
} from '../../types/Dashboard';

// --- Shared date and time helpers ---------------------------------------------------------------------------------------

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const dayOfWeekIndex = (dayName: string) => DAY_NAMES.indexOf(dayName);

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
  reqTimestamp: Support_Request['reqTimestamp'];
  sessTimeSlot: Support_Session['sessTimeSlot'];
  createdLabel: string;   // (sessTimestamp)
  volunteer?: {
    name: string;
    rating: number;
    ratingCount: number;
    skills?: string[];
    requestStatusLabel?: string;
  };
}

export interface StudentRequestItem extends DashboardRequestItem {
  reqTimestamp: Support_Request['reqTimestamp'];
  volUID: string;
  volunteer: {
    name: string;
    rating: number;
    ratingCount: number;
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
  reqTimestamp: request.reqTimestamp,
  volUID: request.volUID,
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
    ratingCount: volunteer.ratingCount,
    skills: volunteer.skills,
    requestStatusLabel: request.reqStatus,
  },
});

export const buildStudentRequestItems = (
  requests: Support_Request[],
  volunteers: Record<string, StudentVolunteerSummary>,
): StudentRequestItem[] =>
  requests.map(request =>
    toStudentRequestItem(request, volunteers[request.volUID] ?? {
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
  reqTimestamp: request.reqTimestamp,
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
  createdLabel: formatDate(session.sessTimestamp.toDate()),
  status: getStudentSessionStatus(session),
  description: request.description,
  supportMode: session.supportMode,
  timeslot: formatTimeslot(session.sessTimeSlot.toDate()),
  location: session.meetingLocation,
  volunteer: {
    name: volunteer.name,
    rating: volunteer.rating,
    ratingCount: volunteer.ratingCount,
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
    const volunteer = request ? volunteers[request.volUID] : undefined;
    return request && volunteer ? [toStudentSessionItem(session, request, volunteer)] : [];
  });
