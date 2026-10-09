import type {
  DashboardRequestItem,
  DashboardSessionItem,
  DashboardStatus,
} from '../../types/Dashboard';
import type { Support_Request } from '../../types/Support_Request';
import type { Support_Session } from '../../types/Support_Session';

// --- Volunteer dashboard display models ---------------------------------------------------------------------------------------

export type VolunteerRequestItem = DashboardRequestItem;

export type VolunteerSessionItem = DashboardSessionItem & {
  reqID: string;
  sessTimeSlot: Date;
  volunteerRating?: number;
  requesterStatus?: string;
  studentFeedback?: { rating: number; comments: string };
};

// -- Volunteer session status and mapping ---------------------------------------------------------------------------------------

const VOLUNTEER_SESSION_STATUS: Record<Support_Session['sessStatus'], DashboardStatus> = {
  Planned: { label: 'Planned', tone: 'planned' },
  Confirmed: { label: 'Confirmed', tone: 'confirmed' },
  Completed: { label: 'Completed', tone: 'completed' },
  Rated: { label: 'Completed', tone: 'completed' },
  Cancelled: { label: 'Cancelled', tone: 'cancelled' },
};

export const getVolunteerSessionStatus = (item: VolunteerSessionItem, now = new Date()) => {
  if (item.sessStatus === 'Planned') {
    if (item.studConfirmed && !item.volConfirmed) return { label: 'To Confirm', tone: 'to-confirm' as const };
    if (!item.studConfirmed && item.volConfirmed) return { label: 'Waiting', tone: 'planned' as const };
  }

  const sessionElapsed = item.sessTimeSlot.getTime() + 60 * 60 * 1000 <= now.getTime();
  if (item.sessStatus === 'Confirmed' && sessionElapsed) {
    return { label: 'Elapsed', tone: 'to-confirm' as const };
  }

  return VOLUNTEER_SESSION_STATUS[item.sessStatus];
};

// -- Volunteer request status and mapping ---------------------------------------------------------------------------------------

const VOLUNTEER_REQUEST_STATUS: Record<Support_Request['reqStatus'], DashboardStatus> = {
  Pending: { label: 'Pending', tone: 'pending' },
  Accepted: { label: 'Accepted', tone: 'accepted' },
  Scheduled: { label: 'Scheduled', tone: 'scheduled' },
  Rejected: { label: 'Rejected', tone: 'rejected' },
  Cancelled: { label: 'Cancelled', tone: 'cancelled' },
};

// -- Volunteer status update helpers  ---------------------------------------------------------------------------------------

export const createVolunteerRequestPatch = (
  reqStatus: Support_Request['reqStatus'],
): Pick<DashboardRequestItem, 'reqStatus' | 'status'> => ({
  reqStatus,
  status: VOLUNTEER_REQUEST_STATUS[reqStatus],
});

export const createVolunteerSessionPatch = (
  sessStatus: VolunteerSessionItem['sessStatus'],
): Pick<VolunteerSessionItem, 'sessStatus' | 'status'> => ({
  sessStatus,
  status: VOLUNTEER_SESSION_STATUS[sessStatus],
});

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
    sessTimeSlot,
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