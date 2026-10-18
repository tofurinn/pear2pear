import type { Support_Request } from '../../../types/Support_Request';
import type { StudentRequestVolunteer } from '../../../types/StudentRequestVolunteer';
import { DAY_NAMES, hourToSlot, slotToHour } from '../student-utils.tsx';

// ─── Form types ────────────────────────────────────────────────────────────────

export type SupportMode = 'Physical' | 'Virtual';
export const MAX_REQUEST_TITLE_LENGTH = 35;
export const MAX_REQUEST_DESCRIPTION_LENGTH = 255;

export type RequestStepKey = 'supportType';

export const isStepValid = (
  step: RequestStepKey,
  data: Pick<RequestFormData, 'category' | 'title' | 'description'>,
): boolean => {
  switch (step) {
    case 'supportType':
      return data.category !== '' &&
        data.title.trim() !== '' &&
        data.title.length <= MAX_REQUEST_TITLE_LENGTH &&
        data.description.trim() !== '' &&
        data.description.length <= MAX_REQUEST_DESCRIPTION_LENGTH;
  }
};

// Combined form data across all steps
export interface RequestFormData {
  // Step 1: Support Type
  category: Support_Request['category'] | '';
  title: string;
  description: string;
  // Step 2: Filtering
  supportMode: SupportMode;
  requiredSkills: string[];
  // Step 3: Availability Filtering
  availability: string[];     // recurring weekday slot keys: 'weekday:HH:00'
  // Step 4: Volunteer Match-making
  volUID: string;
}

// ─── Date / time helpers ───────────────────────────────────────────────────────

export const weekdaySlotKey = (weekday: number, hour: number) => `${weekday}:${hourToSlot(hour)}`;
export const parseWeekdaySlotKey = (key: string) => {
  const separator = key.indexOf(':');
  return {
    weekday: Number(key.slice(0, separator)),
    hour: slotToHour(key.slice(separator + 1)),
  };
};

// ─── Form defaults ─────────────────────────────────────────────────────────────

// A function (not a constant) so the default dates are fresh each time the form starts over
export const createEmptyForm = (): RequestFormData => {
  return {
    category: '',
    title: '',
    description: '',
    supportMode: 'Physical',
    requiredSkills: [],
    availability: [],
    volUID: '',
  };
};

// ─── Option lists ──────────────────────────────────────────────────────────────

export const CATEGORIES: Support_Request['category'][] = [
  'General Student Support',
  'Academic Support',
  'Technology Support',
  'New Student Support',
];

// ─── Matching (step 4) ─────────────────────────────────────────────────────────

export type RequestFormVolunteer = StudentRequestVolunteer;

export interface VolunteerMatch extends RequestFormVolunteer {
  overlap: number; // how many of the student's chosen slots the volunteer can cover
}

type MatchCriteria = Pick<RequestFormData, 'category' | 'supportMode' | 'requiredSkills' | 'availability'>;

// A volunteer matches when they offer the category, have ALL the required skills,
// and are free for at least one of the chosen slots. Best overlap first, then rating.
export const matchVolunteers = (
  criteria: MatchCriteria,
  volunteers: RequestFormVolunteer[],
): VolunteerMatch[] =>
  volunteers
    .filter(volunteer => volunteer.supportMode === criteria.supportMode)
    .filter(volunteer => volunteer.categories.includes(criteria.category))
    .filter(volunteer => criteria.requiredSkills.every(skill => volunteer.skills.includes(skill)))
    .map(volunteer => {
      const overlap = criteria.availability.filter(key => {
        const { weekday, hour } = parseWeekdaySlotKey(key);
        return volunteer.availability.some(slot =>
          slot.dayOfWeek === DAY_NAMES[weekday] && slot.availTimeSlot === hour
        );
      }).length;
      return { ...volunteer, overlap };
    })
    .filter(volunteer => volunteer.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || b.rating - a.rating);

// ─── Summary for the confirmation page ─────────────────────────────────────────

export interface RequestSummary {
  category: Support_Request['category'];
  title: string;
  description: string;
  volunteer: RequestFormVolunteer;
}

export const buildSummary = (
  data: RequestFormData,
  volunteers: RequestFormVolunteer[],
): RequestSummary | null => {
  const volunteer = volunteers.find(v => v.volUID === data.volUID);
  if (!volunteer || !data.category) return null;

  return {
    category: data.category,
    title: data.title,
    description: data.description,
    volunteer,
  };
};