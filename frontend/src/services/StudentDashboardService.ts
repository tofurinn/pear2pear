import { getRequestsByStudent } from './RequestService';
import { getUser } from './UserService';
import { getVolunteer } from './VolunteerService';

/** Volunteer details needed to display student dashboard requests. */
export interface VolunteerProfile {
  UID: string;
  name: string;
  skills: string[];
  avgRating: number;
}

/** Loads volunteer user/profile data for the given UIDs, omitting UIDs with no user record. */
export async function getVolunteerProfiles(uids: string[]): Promise<VolunteerProfile[]> {
  const unique = [...new Set(uids.filter(Boolean))];
  const profiles = await Promise.all(
    unique.map(async uid => {
      const [user, vol] = await Promise.all([getUser(uid), getVolunteer(uid)]);
      if (!user) return null;
      return {
        UID: uid,
        name: user.name,
        skills: vol?.skills ?? [],
        avgRating: vol?.avgRating ?? 0,
      };
    })
  );
  return profiles.filter((p): p is VolunteerProfile => p !== null);
}

/** Loads a student's support requests and the volunteer profiles referenced by those requests. */
export async function loadStudentRequests(studUID: string) {
  const requests = await getRequestsByStudent(studUID);
  const volunteers = await getVolunteerProfiles(requests.map(r => r.volUID));
  return { requests, volunteers };
}