import type { RequestItem, SessionItem, StatusTone } from '../../student/dashboards/dashboards-utils.tsx';

export type VolunteerRequestItem = Pick<
  RequestItem,
  'reqID' | 'reqStatus' | 'category' | 'title' | 'personName' | 'dateLabel' | 'status' | 'description'
>;

export type VolunteerSessionItem = SessionItem & {
  reqID: string;
  sessTimeSlot: Date;
  volunteerRating?: number;
  requesterStatus?: string;
  studentFeedback?: { rating: number; comments: string };
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

  return item.status;
};

export const requestPatch = (
  reqStatus: RequestItem['reqStatus'],
  tone: StatusTone,
  label: string,
): Pick<RequestItem, 'reqStatus' | 'status'> => ({ reqStatus, status: { tone, label } });

export const sessionPatch = (
  sessStatus: SessionItem['sessStatus'],
  tone: StatusTone,
  label: string,
): Pick<VolunteerSessionItem, 'sessStatus' | 'status'> => ({ sessStatus, status: { tone, label } });

export const MOCK_INCOMING_REQUESTS: VolunteerRequestItem[] = [
  { reqID: 'r1', reqStatus: 'Pending', category: 'General Student Support', title: 'Cat-sitting for a weekend!', personName: 'Mei Lin', dateLabel: '19 Sep 2026', description: 'I need help looking after my cat while I am away for the weekend.', status: { tone: 'pending', label: 'Pending' } },
  { reqID: 'r2', reqStatus: 'Pending', category: 'Technology Support', title: 'Cybersafe Login Problem', personName: 'Daniel Tan', dateLabel: '11 Sep 2026', description: 'I need help securing my account and resolving a login problem.', status: { tone: 'pending', label: 'Pending' } },
  { reqID: 'req-1', reqStatus: 'Accepted', category: 'General Student Support', title: 'Grass Cutting Helper', personName: 'Chiikawa', dateLabel: '4 Oct 2026', description: 'Looking for some help with cutting the grass.', status: { tone: 'accepted', label: 'Accepted' } },
  { reqID: 'r4', reqStatus: 'Scheduled', category: 'Academic Support', title: 'Study Group Starter', personName: 'Hachiware', dateLabel: '11 Aug 2025', description: 'I would like help getting a study group started.', status: { tone: 'scheduled', label: 'Scheduled' } },
  { reqID: 'r5', reqStatus: 'Rejected', category: 'General Student Support', title: 'Moving Boxes', personName: 'Usagi', dateLabel: '4 Apr 2025', description: 'I need a hand moving some boxes.', status: { tone: 'rejected', label: 'Rejected' } },
];

function mockSession(
  sessID: string,
  reqID: string,
  sessStatus: SessionItem['sessStatus'],
  category: SessionItem['category'],
  title: string,
  personName: string,
  dateLabel: string,
  tone: StatusTone,
  label: string,
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
    status: { tone, label },
    supportMode: 'Physical',
    timeslot: '11AM – 12PM',
    location: 'Student lounge meeting area',
    description: `Support session for ${title}.`,
    ...options,
  };
}

export const MOCK_VOLUNTEER_SESSIONS: VolunteerSessionItem[] = [
  mockSession('sess-1', 'req-1', 'Planned', 'General Student Support', 'Grass Cutting Helper', 'Chiikawa', '4 Oct 2026', 'planned', 'Planned', { requesterStatus: 'Accepted', volConfirmed: true }),
  mockSession('sess-2', 'req-2', 'Planned', 'Technology Support', 'Help Fix My Laptop!!', 'Omniman', '6 Oct 2026', 'planned', 'Planned', { requesterStatus: 'Accepted', studConfirmed: true, supportMode: 'Virtual', location: 'Video call link shared with the student' }),
  mockSession('sess-3', 'req-1', 'Confirmed', 'General Student Support', 'Grass Cutting Helper', 'Chiikawa', '12 Oct 2026', 'confirmed', 'Confirmed', { requesterStatus: 'Accepted', studConfirmed: true, volConfirmed: true }),
  mockSession('sess-4', 'req-4', 'Confirmed', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Natasha Laoshi', '11 Aug 2025', 'confirmed', 'Confirmed', { requesterStatus: 'Accepted', studConfirmed: true, volConfirmed: true }),
  mockSession('sess-5', 'req-4', 'Completed', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Natasha Laoshi', '11 Aug 2025', 'completed', 'Completed', { requesterStatus: 'Accepted', studConfirmed: true, volConfirmed: true }),
];

export const MOCK_VOLUNTEER_HISTORY: VolunteerSessionItem[] = [
  mockSession('h1', 'req-4', 'Rated', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Student Name', '11 Aug 2025', 'completed', 'Completed', { requesterStatus: 'Accepted', volunteerRating: 4.5, studConfirmed: true, volConfirmed: true, studentFeedback: { rating: 4.5, comments: 'Great session with clear explanations. I feel much more confident now.' } }),
  mockSession('h2', 'req-4', 'Rated', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Student Name', '11 Aug 2025', 'completed', 'Completed', { requesterStatus: 'Accepted', volunteerRating: 4.5, studConfirmed: true, volConfirmed: true, studentFeedback: { rating: 5, comments: 'Very patient and helpful. The examples made difficult topics easier to understand.' } }),
  mockSession('h3', 'req-4', 'Rated', 'Academic Support', 'Help Me do Advanced Maths (fec101)', 'Student Name', '11 Aug 2025', 'completed', 'Completed', { requesterStatus: 'Accepted', volunteerRating: 4.5, studConfirmed: true, volConfirmed: true, studentFeedback: { rating: 4.5, comments: 'Loved the clear explanations and supportive teaching.' } }),
  mockSession('h4', 'req-8', 'Cancelled', 'Academic Support', 'Code Website for my Event', 'Steve Jobs', '11 Aug 2025', 'cancelled', 'Cancelled', { requesterStatus: 'Cancelled' }),
  mockSession('h5', 'req-8', 'Cancelled', 'Academic Support', 'Code Website for my Event', 'Steve Jobs', '11 Aug 2025', 'cancelled', 'Cancelled', { requesterStatus: 'Cancelled' }),
];
