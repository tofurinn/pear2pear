import type { Availability } from '../../../types/Availability';
import type { Support_Request } from '../../../types/Support_Request';
import type { Support_Session } from '../../../types/Support_Session';
import {
  formatLongDate,
  formatTimeslotRange,
  hourToSlot,
  parseDateKey,
  slotToHour,
  toDateKey,
  dayOfWeekIndex,
} from '../volunteer-utils.tsx';

// ─── Form types ────────────────────────────────────────────────────────────────

// Combined form data across all steps (maps onto Support_Session fields)
export interface SessionFormData {
  // Step 1
  reqID: string;
  // Step 2
  sessDate: string;      // 'YYYY-MM-DD' -> convert to Date on submit
  sessTimeSlot: string;  // 'HH:00' (start of the hour) -> convert to Timestamp on submit
  // Step 3
  supportMode: 'Physical' | 'Virtual';
  meetingLocation: string;
}

export const EMPTY_FORM: SessionFormData = {
  reqID: '',
  sessDate: '',
  sessTimeSlot: '',
  supportMode: 'Physical',
  meetingLocation: '',
};

// The student on the other side of a request (the volunteer is the signed-in user)
export interface Student {
  studUID: string;
  name: string;
}

export const toWeeklyAvailability = (records: Availability[]): Record<number, number[]> =>
  records.reduce<Record<number, number[]>>((weekly, record) => {
    const weekday = dayOfWeekIndex(record.dayOfWeek);
    if (weekday >= 0) weekly[weekday] = [...(weekly[weekday] ?? []), record.availTimeSlot];
    return weekly;
  }, {});

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
  student: Student;
}

export const buildSessionSummary = (
  data: SessionFormData,
  request: Support_Request,
  student: Student,
): SessionSummary => ({
    category: request.category,
    title: request.title,
    dateLabel: formatLongDate(parseDateKey(data.sessDate)),
    timeslotLabel: formatTimeslotRange(slotToHour(data.sessTimeSlot)),
    supportMode: data.supportMode,
    meetingLocation: data.meetingLocation.trim(),
    student,
});

export const isSessionSlotBookable = (
  dateKey: string,
  slot: string,
  availability: Record<number, number[]>,
  sessions: Support_Session[],
  excludedSessionID?: string,
  now = new Date(),
): boolean => {
  if (!dateKey || !slot || !/^\d{2}:00$/.test(slot)) return false;

  const eligibleDays = new Set(getUpcomingDays(7, now).map(toDateKey));
  const hour = slotToHour(slot);
  const date = parseDateKey(dateKey);
  if (!eligibleDays.has(dateKey) || !availability[date.getDay()]?.includes(hour)) return false;

  const slotTime = new Date(date);
  slotTime.setHours(hour, 0, 0, 0);
  if (slotTime <= now) return false;

  return !isSessionSlotOccupied(dateKey, hour, sessions, excludedSessionID);
};

export const isSessionSlotOccupied = (
  dateKey: string,
  hour: number,
  sessions: Support_Session[],
  excludedSessionID?: string,
): boolean => sessions.some(session => {
  if (session.sessID === excludedSessionID || !['Planned', 'Confirmed'].includes(session.sessStatus)) return false;
  return toDateKey(session.sessDate) === dateKey && session.sessTimeSlot.toDate().getHours() === hour;
});

// ─── Step rules (shared by the booking form and the rearrangement page) ───────

export type SessionStepKey = 'request' | 'timeSlot' | 'meetup';

// Whether a step has what it needs before the volunteer can move on
export const isStepValid = (step: SessionStepKey, data: SessionFormData): boolean => {
  switch (step) {
    case 'request':  return data.reqID !== '';
    case 'timeSlot': return data.sessDate !== '' && data.sessTimeSlot !== '';
    case 'meetup':   return data.meetingLocation.trim() !== '';
  }
};

// ─── Rearranging an existing session ───────────────────────────────────────────

// Keep a selection only if it is inside the same upcoming window shown by the slot grid.
export const sessionToFormData = (session: Support_Session, now = new Date()): SessionFormData => {
  const sessDate = toDateKey(session.sessDate);
  const isUpcoming = getUpcomingDays(7, now).some(day => toDateKey(day) === sessDate);
  return {
    reqID: session.reqID,
    sessDate: isUpcoming ? sessDate : '',
    sessTimeSlot: isUpcoming ? hourToSlot(session.sessTimeSlot.toDate().getHours()) : '',
    supportMode: session.supportMode,
    meetingLocation: session.meetingLocation,
  };
};

// Planned or Confirmed sessions can be rearranged, including sessions whose original slot elapsed.
export const canEditSession = (session: Support_Session): boolean =>
  session.sessStatus === 'Planned' || session.sessStatus === 'Confirmed';